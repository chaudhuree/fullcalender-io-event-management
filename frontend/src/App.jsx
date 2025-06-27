import { useState, useEffect, useRef } from 'react'
import './App.css'
import './calendar-custom.css'

// Import FullCalendar and required plugins
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

function App() {
  const [events, setEvents] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    startTime: '09:00',
    end: '',
    endTime: '10:00',
    allDay: false,
    color: '#3788d8',
    description: ''
  })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [monthEvents, setMonthEvents] = useState([])
  const modalRef = useRef(null)
  const API_URL = 'http://localhost:5000/api'

  // Fetch events from the backend
  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        console.error('Failed to fetch events')
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  // Handle date click to create a new event
  const handleDateClick = (info) => {
    const startDate = info.dateStr
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate())
    
    setFormData({
      title: '',
      start: startDate,
      startTime: '09:00',
      end: startDate,
      endTime: '10:00',
      allDay: false,
      color: '#3788d8',
      description: ''
    })
    setSelectedEvent(null)
    setModalOpen(true)
  }

  // Handle event click to edit an existing event
  const handleEventClick = (info) => {
    const event = events.find(e => e._id === info.event.id)
    if (event) {
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)
      
      setSelectedEvent(event)
      setFormData({
        title: event.title,
        start: startDate.toISOString().split('T')[0],
        startTime: event.allDay ? '00:00' : startDate.toTimeString().slice(0, 5),
        end: endDate.toISOString().split('T')[0],
        endTime: event.allDay ? '23:59' : endDate.toTimeString().slice(0, 5),
        allDay: event.allDay,
        color: event.color || '#3788d8',
        description: event.description || ''
      })
      setModalOpen(true)
    }
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  // Update month events when events or current date changes
  useEffect(() => {
    if (events.length > 0) {
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth()
      const currentYear = currentDate.getFullYear()
      
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.start)
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
      })
      
      // Sort events by date
      const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.start) - new Date(b.start))
      setMonthEvents(sortedEvents)
    }
  }, [events])
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Combine date and time for start and end
    const startDateTime = formData.allDay 
      ? new Date(formData.start) 
      : new Date(`${formData.start}T${formData.startTime}`)
      
    const endDateTime = formData.allDay 
      ? new Date(formData.end + 'T23:59:59') 
      : new Date(`${formData.end}T${formData.endTime}`)
    
    const eventData = {
      title: formData.title,
      start: startDateTime,
      end: endDateTime,
      allDay: formData.allDay,
      color: formData.color,
      description: formData.description
    }

    try {
      let response
      
      if (selectedEvent) {
        // Update existing event
        response = await fetch(`${API_URL}/events/${selectedEvent._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        })
      } else {
        // Create new event
        response = await fetch(`${API_URL}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(eventData)
        })
      }

      if (response.ok) {
        setModalOpen(false)
        fetchEvents()
      } else {
        console.error('Failed to save event')
      }
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  // Handle event deletion
  const handleDelete = async () => {
    if (selectedEvent) {
      try {
        const response = await fetch(`${API_URL}/events/${selectedEvent._id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          setModalOpen(false)
          fetchEvents()
        } else {
          console.error('Failed to delete event')
        }
      } catch (error) {
        console.error('Error deleting event:', error)
      }
    }
  }

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setModalOpen(false)
      }
    }

    if (modalOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modalOpen])

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Calendar App</h1>
          <p className="text-gray-600">Schedule and manage your events</p>
        </div>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="!bg-blue-500 hover:!bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline sidebar-toggle"
        >
          {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
        </button>
      </header>
      
      <div className="flex flex-col md:flex-row gap-4">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="md:w-1/4 bg-white rounded-lg shadow-lg p-4 mb-4 md:mb-0 event-sidebar">
            <h2 className="text-xl font-semibold mb-4">This Month's Events</h2>
            <div className="max-h-[600px]" style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {monthEvents.length > 0 ? (
                <ul className="space-y-2 event-sidebar-list">
                  {monthEvents.map(event => {
                    const eventDate = new Date(event.start)
                    const formattedDate = eventDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })
                    const formattedTime = event.allDay 
                      ? 'All day' 
                      : eventDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                    
                    return (
                      <li 
                        key={event._id} 
                        className="p-2 border-l-4 rounded bg-gray-50 hover:bg-gray-100 cursor-pointer event-sidebar-item"
                        style={{ borderLeftColor: event.color || '#3788d8' }}
                        onClick={() => handleEventClick({ event: { id: event._id } })}
                      >
                        <div className="font-semibold">{event.title}</div>
                        <div className="text-sm text-gray-600">
                          {formattedDate} • {formattedTime}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-500 truncate mt-1">{event.description}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-gray-500">No events this month</p>
              )}
            </div>
          </div>
        )}
        
        {/* Calendar Component */}
        <div className={`bg-white rounded-lg shadow-lg p-4 calendar-container ${sidebarOpen ? 'md:w-3/4' : 'w-full'}`}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay'
          }}
          events={events.map(event => ({
            id: event._id,
            title: event.title,
            start: event.start,
            end: event.end,
            allDay: event.allDay,
            backgroundColor: event.color,
            borderColor: event.color,
            classNames: ['calendar-event']
          }))}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          editable={true}
          selectable={true}
          dayMaxEventRows={false} // Allow unlimited events per day
          expandRows={true} // Expand rows to fit all events
          stickyHeaderDates={true}
          eventDisplay="block" // Display as block to ensure containment
          dayMaxEvents={false} // Show all events without a +more link
          contentHeight="auto" // Auto height based on content
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayHeaderFormat={{
            weekday: 'short'
          }}
          eventDidMount={(info) => {
            // Ensure events stay within bounds
            if (info.el) {
              info.el.style.maxWidth = '100%';
              info.el.style.overflow = 'hidden';
              info.el.style.textOverflow = 'ellipsis';
            }
          }}
        />
      </div>
      </div>
      
      {/* Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedEvent ? 'Edit Event' : 'Create Event'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="start">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start"
                    name="start"
                    value={formData.start}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="end">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end"
                    name="end"
                    value={formData.end}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
              </div>
              
              {!formData.allDay && (
                <div className="grid grid-cols-2 gap-4 mb-4 event-time-inputs">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startTime">
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endTime">
                      End Time
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="allDay"
                    checked={formData.allDay}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-gray-700 text-sm font-bold">All Day Event</span>
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="color">
                  Color
                </label>
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full h-10"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="flex justify-between">
                {selectedEvent && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="!bg-red-500 hover:!bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  >
                    Delete
                  </button>
                )}
                
                <button
                  type="submit"
                  className="!bg-blue-500 hover:!bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-auto"
                >
                  {selectedEvent ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
