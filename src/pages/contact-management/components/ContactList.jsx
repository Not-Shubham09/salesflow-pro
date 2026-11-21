import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import Icon from 'components/AppIcon';
import Image from 'components/AppImage';

const ContactList = ({ 
  contacts, 
  selectedContact, 
  selectedContacts, 
  onContactSelect, 
  onContactMultiSelect,
  onDeleteContact 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A'; // Or 'Never contacted', or an empty string
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date'; // Handle cases where dateString is not a valid date format
    }
    return formatDistanceToNow(date, { addSuffix: true });
  };

  if (contacts.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-secondary">No contacts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[calc(100vh-220px)] divide-y divide-border/60">
      {contacts.map(contact => (
        <div 
          key={contact.id}
          className={`p-3.5 cursor-pointer transition-all duration-150 ${
            selectedContact && selectedContact.id === contact.id 
              ? 'bg-primary-50/60 border-l-3 border-l-primary' 
              : 'hover:bg-slate-50/80 border-l-3 border-l-transparent'
          }`}
          onClick={() => onContactSelect(contact)}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-2.5">
              <input
                type="checkbox"
                checked={selectedContacts.includes(contact.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onContactMultiSelect(contact.id);
                }}
                className="h-3.5 w-3.5 text-primary border-border rounded focus:ring-primary/20 cursor-pointer"
              />
            </div>
            
            <div className="flex-shrink-0 mr-3">
              <div className="relative">
                <Image
                  src={contact.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                  alt={`${contact.first_name} ${contact.last_name}`}
                  className="w-9 h-9 rounded-full object-cover border border-border"
                />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-surface ${
                  contact.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}></span>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className="text-xs font-semibold text-text-primary truncate">
                  {contact.first_name} {contact.last_name}
                </h3>
                <div className="flex items-center ml-2">
                  {contact.deals && Array.isArray(contact.deals) && contact.deals.some(deal => deal.stage === 'negotiation' || deal.stage === 'proposal') && (
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5" title="Has active deals"></span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteContact(contact.id);
                    }}
                    className="text-text-tertiary hover:text-rose-600 transition-colors duration-150 p-1 rounded"
                    title="Delete Contact"
                  >
                    <Icon name="Trash2" size={13} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary truncate mt-0.5">{contact.company || 'Independent'}</p>
              <div className="flex items-center mt-1">
                <Icon name="Clock" size={12} className="text-text-tertiary mr-1" />
                <span className="text-xs text-text-tertiary">
                  {formatDate(contact.lastContactDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ContactList;