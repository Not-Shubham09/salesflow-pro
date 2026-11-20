import React from 'react';
import Icon from 'components/AppIcon';

const DealActions = ({ onSave, onDelete, onClone, onCreateTask, isSaving }) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Primary Actions */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        title="Save deal changes"
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Icon name="Save" size={16} />
            <span>Save Deal</span>
          </>
        )}
      </button>

      <button
        onClick={onCreateTask}
        className="btn-secondary flex items-center space-x-2"
        title="Create a task related to this deal"
      >
        <Icon name="CheckSquare" size={16} />
        <span>Add Task</span>
      </button>

      {onClone && (
        <button
          onClick={onClone}
          className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center space-x-2 text-sm font-medium transition-colors"
          title="Duplicate this deal"
        >
          <Icon name="Copy" size={16} />
          <span>Clone</span>
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          className="px-3 py-2 border border-error-200 text-error hover:bg-error-50 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors"
          title="Delete this deal"
        >
          <Icon name="Trash2" size={16} />
          <span>Delete</span>
        </button>
      )}
    </div>
  );
};

export default DealActions;
