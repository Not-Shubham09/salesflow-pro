import React, { useState, useEffect } from 'react';

import Icon from 'components/AppIcon';

import Header from 'components/ui/Header';
import Breadcrumb from 'components/ui/Breadcrumb';
import ContactList from './components/ContactList';
import contactService from '../../utils/contactService';
import ContactDetail from './components/ContactDetail';
import ContactForm from './components/ContactForm';
import ImportContactsModal from './components/ImportContactsModal';
import ExportContactsModal from './components/ExportContactsModal';
import MergeDuplicatesModal from './components/MergeDuplicatesModal';
import FilterPanel from './components/FilterPanel';
import { useToast } from '../../contexts/ToastContext';

const ContactManagement = () => {
  const toast = useToast();
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    company: [],
    dealStage: [],
    lastContactDate: null,
    tags: []
  });

  useEffect(() => {
    const fetchContacts = async () => {
      const { data, error } = await contactService.getContacts();
      if (error) {
        console.error('Error fetching contacts:', error);
      } else {
        setContacts(data);
      }
    };
    fetchContacts();
  }, []);




  useEffect(() => {
    if (contacts.length > 0 && window.innerWidth >= 1024) {
      setSelectedContact(contacts[0]);
    }
  }, [contacts]);

  // Filter contacts based on search query and filters
  const filteredContacts = (contacts || []).filter(contact => {
    if (!contact) return false;
    const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
    const email = (contact.email || '').toLowerCase();
    const company = (contact.company || '').toLowerCase();
    const searchLower = (searchQuery || '').toLowerCase();
    
    const matchesSearch = !searchLower || 
                          fullName.includes(searchLower) || 
                          email.includes(searchLower) || 
                          company.includes(searchLower);
    
    // Apply additional filters
    const matchesCompany = !filters.company?.length || 
                          filters.company.includes(contact.company);
    
    const matchesDealStage = !filters.dealStage?.length || 
                            (Array.isArray(contact.deals) && contact.deals.some(deal => filters.dealStage.includes(deal.stage)));
    
    const matchesTags = !filters.tags?.length || 
                        (Array.isArray(contact.tags) && contact.tags.some(tag => filters.tags.includes(tag)));
    
    // Filter by active tab
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && contact.status === 'active') ||
                      (activeTab === 'inactive' && contact.status === 'inactive');
    
    return matchesSearch && matchesCompany && matchesDealStage && matchesTags && matchesTab;
  });

  const handleContactSelect = (contact) => {
    setSelectedContact(contact);
    setIsAddingContact(false);
    setIsEditingContact(false);
  };

  const handleContactMultiSelect = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact.id));
    }
  };

  const handleAddContact = () => {
    setSelectedContact(null);
    setIsAddingContact(true);
    setIsEditingContact(false);
  };

  const handleEditContact = () => {
    setIsAddingContact(false);
    setIsEditingContact(true);
  };

  const handleSaveContact = async (contactData) => {
    if (isAddingContact) {
      // Add new contact
      const { avatar_url, ...restOfContactData } = contactData;
      const { data, error } = await contactService.createContact({
        ...restOfContactData,
        last_contact_date: new Date().toISOString(),
        status: 'active',
      });
      if (error) {
        console.error('Error creating contact:', error);
        toast.error(error || 'Failed to create contact');
      } else {
        toast.success(`Contact "${data.first_name} ${data.last_name}".trim() created!`);
        setContacts([...contacts, data]);
        setSelectedContact(data);
      }
    } else if (isEditingContact && selectedContact) {
      // Update existing contact
      const { data, error } = await contactService.updateContact(selectedContact.id, contactData);
      if (error) {
        console.error('Error updating contact:', error);
        toast.error(error || 'Failed to update contact');
      } else {
        toast.success(`Contact updated successfully!`);
        const updatedContacts = contacts.map(contact => 
          contact.id === selectedContact.id ? data : contact
        );
        setContacts(updatedContacts);
        setSelectedContact(data);
      }
    }
    setIsAddingContact(false);
    setIsEditingContact(false);
  };

  const handleCancelForm = () => {
    setIsAddingContact(false);
    setIsEditingContact(false);
    if (selectedContact === null && contacts.length > 0) {
      setSelectedContact(contacts[0]);
    }
  };

  const handleDeleteContact = async (contactId) => {
    const { success, error } = await contactService.deleteContact(contactId);
    if (error) {
      console.error('Error deleting contact:', error);
      toast.error(error || 'Failed to delete contact');
    } else if (success) {
      toast.success('Contact deleted successfully');
      const updatedContacts = contacts.filter(contact => contact.id !== contactId);
      setContacts(updatedContacts);
      
      if (selectedContact && selectedContact.id === contactId) {
        setSelectedContact(updatedContacts.length > 0 ? updatedContacts[0] : null);
      }
      
      setSelectedContacts(prev => prev.filter(id => id !== contactId));
    }
  };

  const handleBulkDelete = async () => {
    for (const contactId of selectedContacts) {
      const { success, error } = await contactService.deleteContact(contactId);
      if (error) {
        console.error(`Error deleting contact ${contactId}:`, error);
        // Optionally, handle partial success or re-add failed deletions to selectedContacts
      }
    }
    const updatedContacts = contacts.filter(contact => !selectedContacts.includes(contact.id));
    setContacts(updatedContacts);
    
    if (selectedContact && selectedContacts.includes(selectedContact.id)) {
      setSelectedContact(updatedContacts.length > 0 ? updatedContacts[0] : null);
    }
    
    setSelectedContacts([]);
  };

  const handleImportContacts = (importedContacts) => {
    setContacts([...contacts, ...importedContacts]);
    setIsImportModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-text-primary tracking-tight font-heading">Contact Directory</h1>
                <p className="text-text-secondary text-xs sm:text-sm mt-0.5">Manage your customer accounts, relationships, and touchpoints</p>
              </div>
              
              <div className="flex flex-wrap gap-2.5 mt-4 md:mt-0">
                <button 
                  onClick={handleAddContact}
                  className="btn-primary inline-flex items-center space-x-1.5 text-xs sm:text-sm px-3.5 py-1.5 shadow-xs"
                >
                  <Icon name="UserPlus" size={16} />
                  <span>Add Contact</span>
                </button>
                
                <button 
                  onClick={() => setIsImportModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-slate-100/70 text-xs sm:text-sm font-medium transition-all duration-150"
                >
                  <Icon name="Upload" size={15} />
                  <span>Import</span>
                </button>
                
                <button 
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={`inline-flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                    Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== null) || isFilterPanelOpen
                      ? 'border-primary-500 bg-primary-50 text-primary' :'border-border text-text-secondary hover:text-text-primary hover:bg-slate-100/70'
                  }`}
                >
                  <Icon name="Filter" size={15} />
                  <span>Filter</span>
                  {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== null) && (
                    <span className="w-4.5 h-4.5 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {Object.values(filters).reduce((count, f) => count + (Array.isArray(f) ? f.length : (f !== null ? 1 : 0)), 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>
            
            {/* Filter Panel */}
            {isFilterPanelOpen && (
              <FilterPanel 
                filters={filters} 
                setFilters={setFilters} 
                onClose={() => setIsFilterPanelOpen(false)} 
              />
            )}
            
            {/* Search and Tabs */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search contacts by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9.5 text-xs sm:text-sm"
                />
              </div>
              
              <div className="bg-slate-100/70 p-1 rounded-xl border border-border/60 inline-flex self-start md:self-auto">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    activeTab === 'all' 
                      ? 'bg-surface text-primary font-semibold shadow-xs border border-border/80 ring-1 ring-primary/10' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                  }`}
                >
                  All ({contacts.length})
                </button>
                <button
                  onClick={() => setActiveTab('active')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    activeTab === 'active' 
                      ? 'bg-surface text-primary font-semibold shadow-xs border border-border/80 ring-1 ring-primary/10' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                  }`}
                >
                  Active ({contacts.filter(c => c.status === 'active').length})
                </button>
                <button
                  onClick={() => setActiveTab('inactive')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    activeTab === 'inactive' 
                      ? 'bg-surface text-primary font-semibold shadow-xs border border-border/80 ring-1 ring-primary/10' 
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface/60'
                  }`}
                >
                  Inactive ({contacts.filter(c => c.status === 'inactive').length})
                </button>
              </div>
            </div>
            
            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Contact List (Left Panel) */}
              <div className="w-full lg:w-1/3 xl:w-1/4">
                <div className="bg-surface rounded-lg border border-border shadow-sm">
                  {/* List Header with Actions */}
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <span className="ml-3 text-sm text-text-secondary">
                        {selectedContacts.length > 0 ? `${selectedContacts.length} selected` : `${filteredContacts.length} contacts`}
                      </span>
                    </div>
                    
                    {selectedContacts.length > 0 && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsExportModalOpen(true)}
                          className="text-text-secondary hover:text-text-primary"
                          title="Export Selected"
                        >
                          <Icon name="Download" size={16} />
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          className="text-error hover:text-error-600"
                          title="Delete Selected"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                        {selectedContacts.length === 2 && (
                          <button
                            onClick={() => setIsMergeModalOpen(true)}
                            className="text-text-secondary hover:text-text-primary"
                            title="Merge Contacts"
                          >
                            <Icon name="GitMerge" size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Contact List */}
                  <ContactList
                    contacts={filteredContacts}
                    selectedContact={selectedContact}
                    selectedContacts={selectedContacts}
                    onContactSelect={handleContactSelect}
                    onContactMultiSelect={handleContactMultiSelect}
                    onDeleteContact={handleDeleteContact}
                  />
                </div>
              </div>
              
              {/* Contact Detail or Form (Right Panel) */}
              <div className="w-full lg:w-2/3 xl:w-3/4">
                {isAddingContact || isEditingContact ? (
                  <ContactForm
                    contact={isEditingContact ? selectedContact : null}
                    onSave={handleSaveContact}
                    onCancel={handleCancelForm}
                    isEditing={isEditingContact}
                  />
                ) : selectedContact ? (
                  <ContactDetail
                    contact={selectedContact}
                    onEdit={handleEditContact}
                    onDelete={() => handleDeleteContact(selectedContact.id)}
                  />
                ) : (
                  <div className="bg-surface rounded-lg border border-border shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon name="Users" size={24} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No Contact Selected</h3>
                    <p className="text-text-secondary mb-6">Select a contact from the list or add a new one to get started.</p>
                    <button
                      onClick={handleAddContact}
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Icon name="UserPlus" size={18} />
                      <span>Add New Contact</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modals */}
      {isImportModalOpen && (
        <ImportContactsModal
          onImport={handleImportContacts}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
      
      {isExportModalOpen && (
        <ExportContactsModal
          contacts={contacts.filter(contact => selectedContacts.includes(contact.id))}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
      
      {isMergeModalOpen && selectedContacts.length === 2 && (
        <MergeDuplicatesModal
          contact1={contacts.find(c => c.id === selectedContacts[0])}
          contact2={contacts.find(c => c.id === selectedContacts[1])}
          onMerge={(mergedContact) => {
            const updatedContacts = contacts.filter(c => !selectedContacts.includes(c.id));
            setContacts([...updatedContacts, mergedContact]);
            setSelectedContact(mergedContact);
            setSelectedContacts([]);
            setIsMergeModalOpen(false);
          }}
          onClose={() => setIsMergeModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ContactManagement;