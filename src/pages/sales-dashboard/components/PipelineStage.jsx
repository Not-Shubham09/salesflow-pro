import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';

const PipelineStage = ({ stage, totalValue, weightedValue }) => {
  const getStageColor = (stageId) => {
    const colors = {
      'lead': 'bg-gray-50/80 border-gray-200',
      'qualified': 'bg-blue-50/60 border-blue-200',
      'proposal': 'bg-amber-50/60 border-amber-200',
      'negotiation': 'bg-orange-50/60 border-orange-200',
      'closed_won': 'bg-emerald-50/60 border-emerald-200',
      'closed_lost': 'bg-rose-50/60 border-rose-200'
    };
    return colors[stageId] || 'bg-gray-50/80 border-gray-200';
  };

  const getStageIcon = (stageId) => {
    const icons = {
      'lead': 'UserPlus',
      'qualified': 'CheckCircle',
      'proposal': 'FileText',
      'negotiation': 'MessageSquare',
      'closed_won': 'Trophy',
      'closed_lost': 'XCircle'
    };
    return icons[stageId] || 'Circle';
  };

  return (
    <div className={`rounded-xl border p-3 flex flex-col ${getStageColor(stage.id)}`}>
      {/* Stage Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <Icon name={getStageIcon(stage.id)} size={14} className="text-text-secondary" />
          <h3 className="font-semibold text-xs text-text-primary capitalize">{stage.title}</h3>
        </div>
        <span className="text-[11px] font-bold px-1.5 py-0.2 bg-surface rounded-full border border-border text-text-secondary">
          {stage.deals.length}
        </span>
      </div>

      {/* Stage Metrics */}
      <div className="mb-3 space-y-0.5 text-[11px] text-text-secondary pb-2 border-b border-border/60">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-semibold text-text-primary">
            ${((totalValue || 0) / 1000).toFixed(0)}k
          </span>
        </div>
        <div className="flex justify-between">
          <span>Weighted:</span>
          <span className="font-semibold text-text-primary">
            ${((weightedValue || 0) / 1000).toFixed(0)}k
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[220px] flex-1 space-y-2.5 transition-colors rounded-lg p-1 ${
              snapshot.isDraggingOver ? 'bg-primary-50/50' : ''
            }`}
          >
            {stage.deals.map((deal, index) => (
              <Draggable key={String(deal.id)} draggableId={String(deal.id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-surface rounded-lg p-3 border border-border shadow-xs cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-primary-200 group ${
                      snapshot.isDragging ? 'rotate-2 shadow-lg ring-2 ring-primary ring-opacity-50' : ''
                    }`}
                  >
                    {/* Deal Header */}
                    <div className="flex items-start justify-between mb-1.5">
                      <Link
                        to={`/deal-management/${deal.id}`}
                        className="text-xs font-semibold text-text-primary line-clamp-2 hover:text-primary transition-colors flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {deal.title}
                      </Link>
                      <Icon name="GripVertical" size={12} className="text-text-tertiary ml-1 flex-shrink-0" />
                    </div>

                    {/* Deal Value */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-text-primary">
                        ${((deal.value || 0) / 1000).toFixed(0)}k
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary font-medium rounded-full">
                        {deal.probability}%
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="flex items-center space-x-1.5 mb-2 pt-1 border-t border-border/40">
                      <Image
                        src={deal.avatar}
                        alt={deal.contact}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-text-primary truncate">
                          {deal.contact}
                        </p>
                        <p className="text-[10px] text-text-tertiary truncate">
                          {deal.company}
                        </p>
                      </div>
                    </div>

                    {/* Deal Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                      <span>{deal.daysInStage}d in stage</span>
                      <Link
                        to={`/deal-management/${deal.id}`}
                        className="text-primary hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            
            {/* Empty State */}
            {stage.deals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-text-tertiary border border-dashed border-border rounded-lg">
                <Icon name="Inbox" size={18} className="mb-1 text-text-tertiary/60" />
                <span className="text-[11px]">No deals</span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default PipelineStage;
