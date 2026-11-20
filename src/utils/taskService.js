import { supabase, isDemoMode } from './supabase';
import { localCrmStorage } from './localCrmStorage';

class TaskService {
  // Get all tasks for the current user
  async getTasks(filters = {}) {
    if (isDemoMode()) {
      return localCrmStorage.getTasks(filters);
    }

    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          contacts(first_name, last_name, company, email),
          deals(title, value, stage)
        `)
        .order('due_date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.overdue) {
        query = query.lt('due_date', new Date().toISOString());
      }

      if (filters?.upcoming) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        query = query
          .gte('due_date', new Date().toISOString())
          .lte('due_date', nextWeek.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: 'Failed to load tasks.' };
    }
  }

  // Get upcoming tasks for dashboard
  async getUpcomingTasks(userId, limit = 5) {
    if (isDemoMode()) {
      return localCrmStorage.getUpcomingTasks(userId, limit);
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          contacts(first_name, last_name, company),
          deals(title, value)
        `)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      const transformedTasks = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        contact: task.contacts ? `${task.contacts.first_name} ${task.contacts.last_name}` : null,
        company: task.contacts?.company || null,
        deal: task.deals?.title || null,
        dealValue: task.deals?.value || null,
        isOverdue: task.due_date && new Date(task.due_date) < new Date(),
        daysUntilDue: task.due_date ? Math.ceil((new Date(task.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
      }));

      return { success: true, data: transformedTasks };
    } catch (error) {
      return { success: false, error: 'Failed to load upcoming tasks.' };
    }
  }

  // Create a new task
  async createTask(taskData) {
    if (isDemoMode()) {
      return localCrmStorage.createTask(taskData);
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to create task.' };
    }
  }

  // Update an existing task
  async updateTask(taskId, updates) {
    if (isDemoMode()) {
      return localCrmStorage.updateTask(taskId, updates);
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to update task.' };
    }
  }

  // Mark task as completed
  async completeTask(taskId) {
    if (isDemoMode()) {
      return localCrmStorage.updateTask(taskId, { status: 'completed' });
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Failed to complete task.' };
    }
  }

  // Delete a task
  async deleteTask(taskId) {
    if (isDemoMode()) {
      return localCrmStorage.deleteTask(taskId);
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to delete task.' };
    }
  }

  // Get task statistics
  async getTaskStats() {
    if (isDemoMode()) {
      const tasks = localCrmStorage.getTasks().data;
      return {
        success: true,
        data: {
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          pendingTasks: tasks.filter(t => t.status === 'pending').length,
          overdueTasks: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length,
          highPriorityTasks: tasks.filter(t => ['high', 'urgent'].includes(t.priority)).length
        }
      };
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('status, priority, due_date');

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        totalTasks: data?.length || 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        highPriorityTasks: 0
      };

      const now = new Date();
      (data || []).forEach(task => {
        if (task.status === 'completed') {
          stats.completedTasks++;
        } else if (task.status === 'pending' || task.status === 'in_progress') {
          stats.pendingTasks++;
          
          if (task.due_date && new Date(task.due_date) < now) {
            stats.overdueTasks++;
          }
        }
        
        if (task.priority === 'high' || task.priority === 'urgent') {
          stats.highPriorityTasks++;
        }
      });

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, error: 'Failed to load task statistics.' };
    }
  }
}

const taskService = new TaskService();
export default taskService;
