import React, { useState, useEffect } from 'react';
import { AlertCircle, User, Laptop, Calendar, Search, Plus, X, LogOut, MessageSquare } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'hardware',
    priority: 'medium'
  });

  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchTerm, filterStatus, filterPriority, currentUser]);

  const loadData = () => {
    try {
      const saved = localStorage.getItem('tickets');
      if (saved) {
        setTickets(JSON.parse(saved));
      }
    } catch (error) {
      console.log('No existing tickets found, starting fresh');
    }
    setLoading(false);
  };

  const saveTickets = (updatedTickets) => {
    try {
      localStorage.setItem('tickets', JSON.stringify(updatedTickets));
      setTickets(updatedTickets);
    } catch (error) {
      console.error('Failed to save tickets:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    if (currentUser?.role === 'worker') {
      filtered = filtered.filter(t => t.submittedBy === currentUser.username);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredTickets(filtered);
  };

  const handleLogin = (username, role) => {
    setCurrentUser({ username, role });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedTicket(null);
    setShowNewTicket(false);
  };

  const createTicket = () => {
    if (!newTicket.title.trim() || !newTicket.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const ticket = {
      ticketId: `TKT-${Date.now().toString().slice(-6)}`,
      ...newTicket,
      status: 'open',
      submittedBy: currentUser.username,
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };

    const updatedTickets = [ticket, ...tickets];
    saveTickets(updatedTickets);

    setNewTicket({ title: '', description: '', category: 'hardware', priority: 'medium' });
    setShowNewTicket(false);
  };

  const updateTicketStatus = (ticketId, newStatus) => {
    const updatedTickets = tickets.map(t => {
      if (t.ticketId === ticketId) {
        return {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          assignedTo: newStatus === 'in-progress' && !t.assignedTo ? currentUser.username : t.assignedTo
        };
      }
      return t;
    });
    saveTickets(updatedTickets);
    
    if (selectedTicket?.ticketId === ticketId) {
      setSelectedTicket(updatedTickets.find(t => t.ticketId === ticketId));
    }
  };

  const addComment = () => {
    if (!commentText.trim() || !selectedTicket) return;

    const comment = {
      id: Date.now(),
      author: currentUser.username,
      text: commentText,
      timestamp: new Date().toISOString()
    };

    const updatedTickets = tickets.map(t => {
      if (t.ticketId === selectedTicket.ticketId) {
        return {
          ...t,
          comments: [...t.comments, comment],
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    });

    saveTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.ticketId === selectedTicket.ticketId));
    setCommentText('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-indigo-600 rounded-full mb-4">
              <Laptop className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IT Ticketing System</h1>
            <p className="text-gray-600">Select your role to continue</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('worker_' + Math.random().toString(36).substr(2, 5), 'worker')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <User className="w-5 h-5" />
              <span>Login as Worker</span>
            </button>
            
            <button
              onClick={() => handleLogin('it_staff_' + Math.random().toString(36).substr(2, 5), 'it')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
            >
              <Laptop className="w-5 h-5" />
              <span>Login as IT Staff</span>
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Demo Mode - Auto-generated usernames</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Laptop className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">IT Ticketing System</h1>
                <p className="text-sm text-gray-600">
                  {currentUser.role === 'it' ? 'IT Staff Dashboard' : 'Worker Portal'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{currentUser.username}</p>
                <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
                {currentUser.role === 'worker' && (
                  <button
                    onClick={() => setShowNewTicket(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Ticket</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                  <p className="text-gray-600">
                    {currentUser.role === 'worker' 
                      ? 'Create your first ticket to get started'
                      : 'No tickets match your filters'}
                  </p>
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <div
                    key={ticket.ticketId}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition ${
                      selectedTicket?.ticketId === ticket.ticketId ? 'ring-2 ring-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-gray-900">
                            {ticket.ticketId}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{ticket.submittedBy}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(ticket.createdAt)}</span>
                        </span>
                        {ticket.comments.length > 0 && (
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{ticket.comments.length}</span>
                          </span>
                        )}
                      </div>
                      {ticket.assignedTo && (
                        <span className="text-indigo-600 font-medium">
                          Assigned: {ticket.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {showNewTicket && currentUser.role === 'worker' ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Create New Ticket</h3>
                  <button
                    onClick={() => setShowNewTicket(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={newTicket.title}
                      onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="network">Network</option>
                      <option value="access">Access/Permissions</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                      rows="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Detailed description of the issue..."
                    />
                  </div>

                  <button
                    onClick={createTicket}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition"
                  >
                    Create Ticket
                  </button>
                </div>
              </div>
            ) : selectedTicket ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="font-mono text-sm font-semibold text-gray-900">
                      {selectedTicket.ticketId}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{selectedTicket.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('-', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority} priority
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium text-gray-900 capitalize">{selectedTicket.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Submitted By</p>
                      <p className="font-medium text-gray-900">{selectedTicket.submittedBy}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedTicket.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Last Updated</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedTicket.updatedAt)}</p>
                    </div>
                    {selectedTicket.assignedTo && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Assigned To</p>
                        <p className="font-medium text-indigo-600">{selectedTicket.assignedTo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {currentUser.role === 'it' && (
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Update Status</p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTicket.status === 'open' && (
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.ticketId, 'in-progress')}
                          className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm font-medium transition"
                        >
                          Start Progress
                        </button>
                      )}
                      {selectedTicket.status === 'in-progress' && (
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.ticketId, 'resolved')}
                          className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm font-medium transition"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {selectedTicket.status === 'resolved' && (
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.ticketId, 'closed')}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition"
                        >
                          Close Ticket
                        </button>
                      )}
                      {selectedTicket.status !== 'open' && selectedTicket.status !== 'closed' && (
                        <button
                          onClick={() => updateTicketStatus(selectedTicket.ticketId, 'open')}
                          className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm font-medium transition"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Comments ({selectedTicket.comments.length})
                  </h4>
                  
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {selectedTicket.comments.map(comment => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{formatDate(comment.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addComment()}
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={addComment}
                      disabled={!commentText.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Ticket Selected</h3>
                <p className="text-gray-600">Select a ticket to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;