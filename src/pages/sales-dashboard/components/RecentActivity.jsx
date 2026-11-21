import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';
import activityService from 'utils/activityService';

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const { success, data, error } = await activityService.getRecentActivities();
        if (success) {
          setActivities(data);
        } else {
          setError(error);
        }
      } catch (err) {
        setError('Failed to fetch recent activities.');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <div className="card p-5 border border-border/90">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Recent Activity</h3>
          <p className="text-[11px] text-text-tertiary">Real-time audit log of CRM actions</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live stream"></span>
      </div>

      <div className="space-y-3.5">
        {activities.slice(0, 6).map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 group">
            {/* Activity Icon */}
            <div className="flex-shrink-0 w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center border border-border/70 group-hover:border-primary-200 transition-colors">
              <Icon name={activity.icon || 'Clock'} size={13} className={activity.iconColor || 'text-primary'} />
            </div>

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-1.5 mb-0.5">
                <span className="text-[11px] font-semibold text-text-primary truncate">
                  {activity.user?.name || activity.contact?.name || 'Sales Team'}
                </span>
                <span className="text-[10px] text-text-tertiary">&bull;</span>
                <span className="text-[10px] text-text-tertiary whitespace-nowrap">
                  {activity.relativeTime}
                </span>
              </div>
              
              <p className="text-xs font-medium text-text-primary line-clamp-1 group-hover:text-primary transition-colors">
                {activity.subject}
              </p>
              
              {activity.content && (
                <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                  {activity.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* View More Button */}
      <div className="mt-4 pt-3 border-t border-border/80">
        <Link
          to="/activity-timeline"
          className="text-xs font-semibold text-primary hover:text-primary-700 flex items-center justify-center space-x-1 transition-colors"
        >
          <span>View full activity timeline</span>
          <Icon name="ArrowRight" size={12} />
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;