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
    end: '',
    allDay: false,
    color: '#3788d8',
    description: ''
  })
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
    endDate.setDate(endDate.getDate() + 1)
    
    setFormData({
      title: '',
      start: startDate,
      end: endDate.toISOString().split('T')[0],
      allDay: true,
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
      setSelectedEvent(event)
      setFormData({
        title: event.title,
        start: new Date(event.start).toISOString().split('T')[0],
        end: new Date(event.end).toISOString().split('T')[0],
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const eventData = {
      title: formData.title,
      start: new Date(formData.start),
      end: new Date(formData.end),
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
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Calendar App</h1>
        <p className="text-gray-600">Schedule and manage your events</p>
      </header>
      
      {/* Calendar Component */}
      <div className="bg-white rounded-lg shadow-lg p-4 calendar-container">
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
