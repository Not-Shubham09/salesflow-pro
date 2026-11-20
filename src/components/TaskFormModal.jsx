import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Icon from './AppIcon';

const TaskFormModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  const [task, setTask] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    due_date: initialData.due_date || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    status: initialData.status || 'pending',
    priority: initialData.priority || 'medium',
    deal_id: initialData.deal_id || null,
    contact_id: initialData.contact_id || null,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTask({
        title: initialData.title || '',
        description: initialData.description || '',
        due_date: initialData.due_date || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        status: initialData.status || 'pending',
        priority: initialData.priority || 'medium',
        deal_id: initialData.deal_id || null,
        contact_id: initialData.contact_id || null,
      });
    }
  }, [isOpen, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask((prevTask) => ({
      ...prevTask,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave(task);
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl border border-border">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary flex items-center justify-center">
              <Icon name="CheckSquare" size={18} />
            </div>
            <h3 className="text-base font-bold text-text-primary">Add Task</h3>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary p-1">
            <Icon name="X" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={task.title}
              onChange={handleChange}
              className="input-field text-sm"
              placeholder="e.g. Follow up on technical review"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={task.description}
              onChange={handleChange}
              className="input-field text-sm"
              rows="3"
              placeholder="Enter task details..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="due_date" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={task.due_date}
                onChange={handleChange}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={task.status}
                onChange={handleChange}
                className="input-field text-sm"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={task.priority}
                onChange={handleChange}
                className="input-field text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2.5 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:bg-surface-hover text-xs font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TaskFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
};

export default TaskFormModal;
