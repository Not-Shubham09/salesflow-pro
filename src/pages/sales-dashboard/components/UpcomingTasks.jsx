import React, { useState, useEffect } from 'react';
import Icon from 'components/AppIcon';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import taskService from '../../../utils/taskService';
import { Link } from 'react-router-dom';

const UpcomingTasks = ({ tasks: propTasks }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState(propTasks || []);
  const [loading, setLoading] = useState(!propTasks);
  const [error, setError] = useState(null);

  // Load tasks if not provided via props or when propTasks updates
  useEffect(() => {
    if (propTasks) {
      setTasks(propTasks);
      setLoading(false);
    } else if (user) {
      loadUpcomingTasks();
    }
  }, [propTasks, user]);

  const loadUpcomingTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching upcoming tasks for user:', user.id);
      const result = await taskService.getUpcomingTasks(user.id, 5);
      
      if (result?.success) {
        console.log('Successfully fetched tasks:', result.data);
        setTasks(result.data);
      } else {
        console.error('Failed to load tasks:', result?.error);
        setError(result?.error || 'Failed to load tasks');
      }
    } catch (error) {
      console.error('Exception while loading upcoming tasks:', error);
      setError('Failed to load upcoming tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const result = await taskService.completeTask(taskId);
      
      if (result?.success) {
        toast.success('Task marked as completed!');
        // Remove completed task from list
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      } else {
        toast.error(result?.error || 'Failed to complete task');
        setError(result?.error || 'Failed to complete task');
      }
    } catch (error) {
      toast.error('Failed to complete task');
      setError('Failed to complete task');
      console.log('Task completion error:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-slate-100 text-slate-700 border border-slate-200',
      medium: 'bg-blue-50 text-blue-700 border border-blue-200',
      high: 'bg-amber-50 text-amber-700 border border-amber-200',
      urgent: 'bg-rose-50 text-rose-700 border border-rose-200'
    };
    return colors[priority] || colors.medium;
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return 'No due date';
    
    const date = new Date(dueDate);
    const now = new Date();
    const diffMs = date - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-medium text-text-primary mb-4">Upcoming Tasks</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-medium text-text-primary mb-4">Upcoming Tasks</h3>
        <div className="text-center py-4">
          <Icon name="AlertCircle" size={24} className="text-error mx-auto mb-2" />
          <p className="text-text-secondary text-sm">{error}</p>
          <button 
            onClick={loadUpcomingTasks}
            className="btn-primary btn-sm mt-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 border border-border/90">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Upcoming Tasks</h3>
          <p className="text-[11px] text-text-tertiary">Action items requiring follow-up</p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-text-secondary border border-border">
          {tasks?.length || 0}
        </span>
      </div>
      
      {tasks?.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="CheckCircle" size={40} className="text-emerald-500 mx-auto mb-2 opacity-80" />
          <p className="text-text-secondary text-xs font-medium">All caught up! No upcoming tasks.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks?.map((task) => (
            <div 
              key={task.id} 
              className={`p-3 rounded-xl border transition-all duration-150 ${
                task.isOverdue 
                  ? 'border-rose-200 bg-rose-50/50 hover:bg-rose-50' 
                  : 'border-border/80 bg-slate-50/50 hover:bg-surface hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`text-[11px] ${task.isOverdue ? 'text-rose-600 font-semibold' : 'text-text-tertiary'}`}>
                      {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-text-primary text-xs mb-1 truncate">
                    {task.title}
                  </h4>
                  
                  {task.description && (
                    <p className="text-text-secondary text-[11px] mb-1.5 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  {(task.contact || task.deal) && (
                    <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                      {task.contact && (
                        <span className="truncate">👤 {task.contact}</span>
                      )}
                      {task.deal && (
                        <span className="truncate">💼 {task.deal}</span>
                      )}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleCompleteTask(task.id)}
                  className="ml-2 w-6 h-6 rounded-full border border-border flex items-center justify-center text-text-tertiary hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all cursor-pointer flex-shrink-0"
                  title="Mark as complete"
                >
                  <Icon name="Check" size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingTasks;