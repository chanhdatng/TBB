import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, AlertCircle, User, ShoppingBag, Receipt, MapPin, Phone, Save, Globe, Loader2, ChevronDown, ArrowDown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { scaleVariants, backdropVariants, shakeVariants } from '../../utils/animations';

const CreateOrderModal = ({ isOpen, onClose, onCreateOrder, editingOrder, onUpdateOrder, initialData, onDraftSaved, onDeleteDraft }) => {
    const { products, customers } = useData();

    // Fallback if products are not loaded yet
    const displayProducts = products.length > 0 ? products : [
        { name: 'Loading...', price: 0 }
    ];

    // Form State
    const initialCustomer = { name: '', phone: '', address: '', socialLink: '' };
    const initialItems = [{ id: Date.now(), name: '', quantity: 1, price: 0 }];
    const initialFees = { ship: 0, discount: 0, other: 0 };

    const [customer, setCustomer] = useState(initialCustomer);
    const [items, setItems] = useState(initialItems);
    const [fees, setFees] = useState(initialFees);
    const [orderNote, setOrderNote] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [activeSearchId, setActiveSearchId] = useState(null);

    // Customer suggestions states
    const [customerNameSuggestions, setCustomerNameSuggestions] = useState([]);
    const [customerPhoneSuggestions, setCustomerPhoneSuggestions] = useState([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState({ name: false, phone: false });
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [showAddressList, setShowAddressList] = useState(false);

    // Date & Time State
    const [orderDate, setOrderDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [orderTime, setOrderTime] = useState(new Date().toTimeString().slice(0, 5));
    const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('');

    // Priority State
    const [priority, setPriority] = useState('normal');

    const TIME_SLOTS = [
        "10:00 - 12:00",
        "12:00 - 14:00",
        "14:00 - 16:00",
        "16:00 - 18:00",
        "18:00 - 20:00"
    ];

    // Validation State
    const [isShake, setIsShake] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Function to auto-select time slot based on current time
    const getAutoSelectedTimeSlot = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        // Define time slots in minutes from start of day
        const slots = [
            { name: "10:00 - 12:00", start: 10 * 60, end: 12 * 60 },
            { name: "12:00 - 14:00", start: 12 * 60, end: 14 * 60 },
            { name: "14:00 - 16:00", start: 14 * 60, end: 16 * 60 },
            { name: "16:00 - 18:00", start: 16 * 60, end: 18 * 60 },
            { name: "18:00 - 20:00", start: 18 * 60, end: 20 * 60 }
        ];

        // Find the most suitable slot
        for (const slot of slots) {
            if (currentTimeInMinutes >= slot.start && currentTimeInMinutes < slot.end) {
                return slot.name;
            }
        }

        // If current time is before all slots, return the first slot
        if (currentTimeInMinutes < slots[0].start) {
            return slots[0].name;
        }

        // If current time is after all slots, return the last slot
        if (currentTimeInMinutes >= slots[slots.length - 1].end) {
            return slots[slots.length - 1].name;
        }

        // Otherwise, find the next available slot
        for (const slot of slots) {
            if (currentTimeInMinutes < slot.start) {
                return slot.name;
            }
        }

        return slots[0].name; // fallback
    };

    // Effect to close address list when customer changes
    useEffect(() => {
        setShowAddressList(false);
    }, [customer.id]);

    // Effect to close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close address dropdown if clicking outside
            const addressContainer = event.target.closest('.address-dropdown-container');
            if (!addressContainer && showAddressList) {
                setShowAddressList(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showAddressList]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setShowValidation(false);
            setIsShake(false);
            setIsLoading(false);

            if (editingOrder) {
                // Populate form with existing order data
                setCustomer({
                    name: editingOrder.customer.name,
                    phone: editingOrder.customer.phone,
                    address: editingOrder.customer.address,
                    socialLink: editingOrder.customer.socialLink || ''
                });

                // Map items
                const mappedItems = editingOrder.items.map(item => ({
                    id: Date.now() + Math.random(), // New temp ID for UI
                    name: item.name,
                    quantity: item.amount,
                    price: item.price
                }));
                setItems(mappedItems);

                // Map fees
                setFees({
                    ship: editingOrder.originalData?.shipFee || 0,

                    discount: (() => {
                        const d = editingOrder.originalData?.discount || 0;
                        if (d <= 100) return d;
                        // Backward compatibility: calculate percentage from amount
                        const subtotal = mappedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                        return subtotal > 0 ? (d / subtotal) * 100 : 0;
                    })(),
                    other: editingOrder.originalData?.otherFee || 0
                });

                // Set order note
                setOrderNote(editingOrder.originalData?.orderNote || '');

                // Map Date & Time
                // editingOrder.timeline.received.raw is a Date object
                const dateObj = editingOrder.timeline.received.raw;
                setOrderDate(dateObj.toLocaleDateString('en-CA')); // YYYY-MM-DD
                setOrderTime(dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

                // Set time slot if available, otherwise try to match or leave empty
                if (editingOrder.originalData?.deliveryTimeSlot) {
                    setDeliveryTimeSlot(editingOrder.originalData.deliveryTimeSlot);
                } else {
                    setDeliveryTimeSlot('');
                }

                // Set priority (default to 'normal' for backward compatibility)
                setPriority(editingOrder.originalData?.priority || 'normal');

            } else if (initialData) {
                // Restore from Draft
                setCustomer(initialData.customer);
                setItems(initialData.items);
                setFees(initialData.fees);
                setOrderDate(initialData.orderDate);
                setDeliveryTimeSlot(initialData.deliveryTimeSlot);
                setPriority(initialData.priority || 'normal');
            } else {
                // Reset to initial state
                setCustomer(initialCustomer);
                setItems([{ id: Date.now(), name: '', quantity: 1, price: 0 }]);
                setFees(initialFees);
                setOrderNote('');
                setOrderDate(new Date().toLocaleDateString('en-CA'));
                setOrderTime(new Date().toTimeString().slice(0, 5));
                // Auto-select time slot based on current time
                setDeliveryTimeSlot(getAutoSelectedTimeSlot());
                // Reset priority to default
                setPriority('normal');
            }
            setShowConfirm(false);
        }
    }, [isOpen, editingOrder, initialData]);

    // Function to handle customer name search
    const handleCustomerNameChange = (value) => {
        setCustomer({ ...customer, name: value });

        if (value.trim() === '') {
            setCustomerNameSuggestions([]);
            setShowCustomerSuggestions({ ...showCustomerSuggestions, name: false });
            return;
        }

        const searchLower = value.toLowerCase();
        const suggestions = customers.filter(c =>
            c && c.name && c.name.toLowerCase().includes(searchLower)
        ).slice(0, 5); // Limit to 5 suggestions

        setCustomerNameSuggestions(suggestions);
        setShowCustomerSuggestions({ ...showCustomerSuggestions, name: suggestions.length > 0 });
    };

    // Function to handle customer phone search
    const handleCustomerPhoneChange = (value) => {
        setCustomer({ ...customer, phone: value });

        if (value.trim() === '') {
            setCustomerPhoneSuggestions([]);
            setShowCustomerSuggestions({ ...showCustomerSuggestions, phone: false });
            return;
        }

        const normalize = (p) => p ? String(p).replace(/\D/g, '') : '';
        const normalizedNewPhone = normalize(value);

        const suggestions = customers.filter(c =>
            c && c.phone && normalize(c.phone).includes(normalizedNewPhone)
        ).slice(0, 5); // Limit to 5 suggestions

        setCustomerPhoneSuggestions(suggestions);
        setShowCustomerSuggestions({ ...showCustomerSuggestions, phone: suggestions.length > 0 });
    };

    // Function to select a customer from suggestions
    const selectCustomer = (customerData) => {
        setCustomer({
            name: customerData.name,
            phone: customerData.phone,
            address: customerData.address,
            socialLink: customerData.socialLink || '',
            id: customerData.id
        });
        setSelectedCustomerId(customerData.id);
        setShowAddressList(false); // Close address list when selecting new customer
        setShowCustomerSuggestions({ name: false, phone: false });
        setCustomerNameSuggestions([]);
        setCustomerPhoneSuggestions([]);
    };

    const handleSaveDraft = () => {
        const draftData = {
            id: Date.now(), // Unique ID for the draft
            savedAt: new Date().toISOString(),
            customer,
            items,
            fees,
            orderDate,
            deliveryTimeSlot,
            priority
        };

        // Get existing drafts
        const existingDrafts = JSON.parse(localStorage.getItem('order_drafts') || '[]');

        // If we are editing a draft (initialData exists), we might want to update it instead of creating new?
        // For simplicity, let's just add new one for now, or replace if ID matches.
        // But initialData might not have ID if it was just passed as props. 
        // Let's just append for now to be safe.

        const newDrafts = [draftData, ...existingDrafts];
        localStorage.setItem('order_drafts', JSON.stringify(newDrafts));

        if (onDraftSaved) onDraftSaved();
        alert("Đã lưu nháp thành công!");
        onClose();
    };

    if (!isOpen) return null;

    // Handlers
    const handleAddItem = () => {
        setItems([...items, { id: Date.now(), name: '', quantity: 1, price: 0 }]);
    };

    const handleRemoveItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'name') {
                    const product = displayProducts.find(p => p.name === value);
                    if (product) {
                        updatedItem.price = product.price;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = (itemsTotal * fees.discount) / 100;
        return itemsTotal + Number(fees.ship) - discountAmount;
    };

    const isDirty = () => {
        // Check if any field has been modified from its initial state
        if (editingOrder) {
            // For editing, we could do a deep comparison, but for now let's just check if basic fields changed significantly
            // or if the user has touched anything.
            // A simple way is to compare JSON stringified versions of key data, but that might be too strict with order of keys.
            // Let's stick to the requirement: "khi modal tạo đơn đang chứa thông tin" -> mostly for new orders.
            // But if editing, we should also warn if they changed something.
            
            // Simplified check for editing: always warn if they try to close? No, that's annoying.
            // Let's check against the state we set in useEffect.
            // Since we don't keep a copy of "initial edit state" in a separate variable (we set it directly to state),
            // we can't easily compare without refactoring to store "originalState".
            // However, we have `editingOrder` prop. We can compare current state to `editingOrder`.
            
            const currentCustomer = {
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                socialLink: customer.socialLink || ''
            };
            const originalCustomer = {
                name: editingOrder.customer.name,
                phone: editingOrder.customer.phone,
                address: editingOrder.customer.address,
                socialLink: editingOrder.customer.socialLink || ''
            };
            if (JSON.stringify(currentCustomer) !== JSON.stringify(originalCustomer)) return true;

            // Check items length
            if (items.length !== editingOrder.items.length) return true;
            
            // Check fees
            if (Number(fees.ship) !== (editingOrder.originalData?.shipFee || 0)) return true;
            if (Number(fees.discount) !== (editingOrder.originalData?.discount || 0)) return true;
            if (Number(fees.other) !== (editingOrder.originalData?.otherFee || 0)) return true;
            if (orderNote !== (editingOrder.originalData?.orderNote || '')) return true;

            // Check Date/Time
            // This is a bit tricky due to format conversions, let's skip strict date check for now to avoid false positives
            // unless we are sure.
            
            return false; 
        }

        // For New Order (most important case from user request)
        // Check if any field is not empty/default
        
        // Customer
        if (customer.name.trim() !== '' || customer.phone.trim() !== '' || customer.address.trim() !== '' || customer.socialLink.trim() !== '') return true;
        
        // Items
        // Initial items is [{ id: ..., name: '', quantity: 1, price: 0 }]
        if (items.length > 1) return true;
        if (items.length === 1) {
            if (items[0].name.trim() !== '' || items[0].price !== 0 || items[0].quantity !== 1) return true;
        }

        // Fees
        if (Number(fees.ship) !== 0 || Number(fees.discount) !== 0 || Number(fees.other) !== 0 || orderNote.trim() !== '') return true;

        // Time Slot
        if (deliveryTimeSlot !== '') return true;

        return false;
    };

    const handleCloseAttempt = () => {
        if (isDirty()) {
            setShowConfirm(true);
        } else {
            onClose();
        }
    };

    // Helper: Generate MongoDB-style ObjectId (24 hex chars)
    const generateObjectId = () => {
        const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
        const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        return timestamp + machineId + processId + counter;
    };

    // Helper: Convert Date to CFAbsoluteTime (seconds since 2001-01-01 00:00:00 UTC)
    const toCFAbsoluteTime = (date) => {
        const time2001 = 978307200000; // Milliseconds
        return (date.getTime() - time2001) / 1000;
    };

    // Helper: Generate UUID for customer (if needed)
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        }).toUpperCase();
    };

    const handleSelectProduct = (itemId, product) => {
        setItems(prevItems => {
            const newItems = prevItems.map(item => {
                if (item.id === itemId) {
                    return { ...item, name: product.name, price: product.price };
                }
                return item;
            });

            // Check if the item being modified is the last one in the list
            if (prevItems[prevItems.length - 1].id === itemId) {
                newItems.push({ id: Date.now() + Math.random(), name: '', quantity: 1, price: 0 });
            }

            return newItems;
        });
        setActiveSearchId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validItems = items.filter(item => item.name && item.name.trim() !== '');

        // Validation
        if (!deliveryTimeSlot || validItems.length === 0) {
            setShowValidation(true);
            setIsShake(true);
            setTimeout(() => setIsShake(false), 500);
            return;
        }

        const now = new Date();

        // Determine time to use: either start of slot or manual time (if we kept manual time as fallback, but here we enforce slots mostly)
        // If a slot is selected, use the start time of the slot for the timestamp
        let finalTime = orderTime;
        if (deliveryTimeSlot) {
            // Extract start time from slot string "10:00 - 12:00" -> "10:00"
            finalTime = deliveryTimeSlot.split(' - ')[0];
        }

        // Combine selected date and time
        const selectedDateTime = new Date(`${orderDate}T${finalTime}`);

        // Construct order object
        const orderData = {
            id: editingOrder ? editingOrder.id : generateObjectId(), // Keep ID if editing
            address: customer.address,
            cakes: validItems.map(item => ({
                amount: item.quantity,
                id: generateObjectId(), // Generate ID for items too
                name: item.name,
                price: item.price
            })),
            createDate: editingOrder ? editingOrder.originalData.createDate : toCFAbsoluteTime(now), // Keep createDate if editing
            customer: {
                address: customer.address,
                id: customer.id || (editingOrder?.customer?.id) || generateUUID(),
                name: customer.name,
                phone: customer.phone,
                socialLink: customer.socialLink
            },
            customerPhone: customer.phone,

            discount: Number(fees.discount),
            orderDate: toCFAbsoluteTime(selectedDateTime), // Use selected date/time
            deliveryTimeSlot: deliveryTimeSlot, // Save the slot string
            priority: priority, // Priority level: 'high', 'normal', 'low'
            otherFee: Number(fees.other),
            orderNote: orderNote, // Order-specific note
            payMethod: "Bank", // Default value
            shipFee: Number(fees.ship),
            social: "Instagram", // Default value
            state: editingOrder ? editingOrder.originalData.state : "Đặt trước" // Keep state if editing
        };

        if (editingOrder) {
            onUpdateOrder(orderData);
            onClose();
        } else {
            setIsLoading(true);
            // Close modal immediately for "background" feel
            // We pass the promise or handle it in parent, but here we just want to close and show loading on button briefly if needed
            // But requirement says: "hiển thị loading ở nút và tự động tắt modal sau đó chạy ngầm"
            // So: Show loading -> Wait a bit (optional) -> Close Modal -> Parent handles the rest (Toast)

            // Actually, if we want to show loading on button, we can't close modal immediately.
            // "hiển thị loading ở nút và tự động tắt modal" -> Show loading on button, THEN close modal.
            // But if we close modal, the button is gone.
            // So the flow is: User clicks -> Button shows loading -> (Async work starts) -> Modal closes -> (Async work finishes) -> Toast.

            // To achieve "background" feel, we should just fire the onCreateOrder (which should be async or return promise) 
            // and NOT await it here for the modal close, OR await it but the parent handles the "background" part.

            // Let's do this:
            // 1. Set loading
            // 2. Call onCreateOrder (which we will make async in parent)
            // 3. Wait for it? No, user wants "chạy ngầm" (run in background).
            // So we should probably just call it, and close the modal. 
            // BUT "hiển thị loading ở nút" implies we see it loading.
            // Maybe show loading for 500ms then close?

            try {
                await onCreateOrder(orderData);

                // If created from draft, delete the draft
                if (initialData && onDeleteDraft) {
                    onDeleteDraft(initialData.id);
                }

                onClose();
                // The parent will handle the actual DB call and Toast. 
                // If parent is async and we await it, the modal stays open until done.
                // If we want "background", parent should return immediately or we don't await.

                // Let's assume onCreateOrder in parent will handle the "backgrounding" logic (returning promise that resolves when done, or just fire and forget).
                // But to show loading on button, we need to wait for SOMETHING.
                // If we just want visual feedback:

                // New plan based on "chạy ngầm":
                // 1. setIsLoading(true)
                // 2. await new Promise(r => setTimeout(r, 500)) // Fake loading for visual feedback
                // 3. onClose()
                // 4. onCreateOrder(orderData) // Fire and forget from modal's perspective, but parent handles the actual async work and Toast.
            } catch (error) {
                console.error("Error creating order:", error);
                setIsLoading(false);
            }
        }
    };

    // Derived state for validation check (to style button)
    const isValid = deliveryTimeSlot && items.some(item => item.name && item.name.trim() !== '');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={handleCloseAttempt}
                >
                    <div className="flex min-h-full items-center justify-center p-4">
                        <motion.div
                            className="bg-white rounded-2xl w-full max-w-2xl lg:max-w-6xl shadow-xl relative"
                            variants={scaleVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={(e) => e.stopPropagation()}
                        >

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">{editingOrder ? 'Edit Order' : 'Create New Order'}</h2>
                    <div className="flex items-center gap-2">
                        {!editingOrder && (
                            <button
                                onClick={handleSaveDraft}
                                className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
                                title="Save Draft"
                            >
                                <Save size={20} />
                                <span className="hidden sm:inline">Save Draft</span>
                            </button>
                        )}
                        <button onClick={handleCloseAttempt} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8">

                    {/* Left Column: Customer & Items */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Section 1: Customer */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                                <User size={20} />
                                <h3>Customer Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={customer.name}
                                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                                        onFocus={() => customer.name.trim() !== '' && setShowCustomerSuggestions({ ...showCustomerSuggestions, name: true })}
                                        onBlur={() => setTimeout(() => setShowCustomerSuggestions({ ...showCustomerSuggestions, name: false }), 200)}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Customer Name"
                                    />
                                    {showCustomerSuggestions.name && customerNameSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {customerNameSuggestions.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                    onMouseDown={() => selectCustomer(c)}
                                                >
                                                    <div className="font-medium text-gray-900">{c.name}</div>
                                                    <div className="text-xs text-gray-500">{c.phone}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <div className="relative">
                                        <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="tel"
                                            required
                                            value={customer.phone}
                                            onChange={(e) => handleCustomerPhoneChange(e.target.value)}
                                            onFocus={() => customer.phone.trim() !== '' && setShowCustomerSuggestions({ ...showCustomerSuggestions, phone: true })}
                                            onBlur={() => setTimeout(() => setShowCustomerSuggestions({ ...showCustomerSuggestions, phone: false }), 200)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    {showCustomerSuggestions.phone && customerPhoneSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {customerPhoneSuggestions.map(c => (
                                                <div
                                                    key={c.id}
                                                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                                                    onMouseDown={() => selectCustomer(c)}
                                                >
                                                    <div className="font-medium text-gray-900">{c.phone}</div>
                                                    <div className="text-xs text-gray-500">{c.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative address-dropdown-container">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <div className="relative">
                                        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={customer.address}
                                            onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                                            className={`w-full pl-10 pr-10 py-2 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 ${customer.id ? 'border-gray-200' : 'border-gray-200'}`}
                                            placeholder="Delivery Address"
                                        />
                                        {customer.id && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressList(!showAddressList)}
                                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-all ${showAddressList ? 'bg-primary text-white' : 'text-gray-400 hover:text-primary hover:bg-primary/10'}`}
                                            >
                                                <ChevronDown size={16} className={`transition-transform ${showAddressList ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                    {customer.id && showAddressList && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                                            <div className="p-3 border-b border-gray-100">
                                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ đã lưu</div>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto">
                                                {(() => {
                                                    const customerData = customers.find(c => c.id === customer.id);
                                                    if (customerData && customerData.addresses && customerData.addresses.length > 0) {
                                                        return customerData.addresses.map((address, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => {
                                                                    setCustomer({ ...customer, address: address });
                                                                    setShowAddressList(false);
                                                                }}
                                                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-b-0"
                                                            >
                                                                <div className="flex items-start gap-2">
                                                                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                                    <span className="text-gray-700">{address}</span>
                                                                </div>
                                                            </div>
                                                        ));
                                                    } else {
                                                        return (
                                                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                                Chưa có địa chỉ nào được lưu
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Social Link <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <div className="relative">
                                        <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={customer.socialLink}
                                            onChange={(e) => setCustomer({ ...customer, socialLink: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Facebook/Instagram URL"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <ShoppingBag size={20} />
                                    <h3>Order Items</h3>
                                </div>
                            </div>

                            <motion.div
                                className={`space-y-3 p-2 rounded-xl transition-all ${showValidation && items.every(i => !i.name) ? 'border-2 border-red-500 bg-red-50' : ''}`}
                                animate={isShake && items.every(i => !i.name) ? "shake" : ""}
                                variants={shakeVariants}
                            >
                                {items.map((item, index) => (
                                    <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex-1 w-full relative">
                                            <input
                                                type="text"
                                                value={item.name}
                                                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                onFocus={() => setActiveSearchId(item.id)}
                                                onBlur={() => setTimeout(() => setActiveSearchId(null), 200)}
                                                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${showValidation && !item.name ? 'border-red-500' : 'border-gray-200'}`}
                                                placeholder="Select or type cake name"
                                            />
                                            {activeSearchId === item.id && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {displayProducts
                                                        .filter(p => p.name.toLowerCase().includes((item.name || '').toLowerCase()))
                                                        .map(p => (
                                                            <div
                                                                key={p.id || p.name}
                                                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm flex justify-between items-center"
                                                                onMouseDown={() => {
                                                                    handleSelectProduct(item.id, p);
                                                                }}
                                                            >
                                                                <span className="font-medium text-gray-900">{p.name}</span>
                                                                <span className="text-gray-500 text-xs">
                                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price)}
                                                                </span>
                                                            </div>
                                                        ))
                                                    }
                                                    {displayProducts.filter(p => p.name.toLowerCase().includes((item.name || '').toLowerCase())).length === 0 && (
                                                        <div className="px-3 py-2 text-sm text-gray-500 text-center">No items found</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentVal = parseInt(item.quantity) || 0;
                                                        if (currentVal > 1) {
                                                            handleItemChange(item.id, 'quantity', currentVal - 1);
                                                        }
                                                    }}
                                                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors border-r border-gray-200"
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') {
                                                            handleItemChange(item.id, 'quantity', '');
                                                        } else {
                                                            const num = parseInt(val);
                                                            if (!isNaN(num) && num > 0) {
                                                                handleItemChange(item.id, 'quantity', num);
                                                            }
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        if (!item.quantity || parseInt(item.quantity) < 1) {
                                                            handleItemChange(item.id, 'quantity', 1);
                                                        }
                                                    }}
                                                    className="w-12 py-2 text-center focus:outline-none text-sm font-medium"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentVal = parseInt(item.quantity) || 0;
                                                        handleItemChange(item.id, 'quantity', currentVal + 1);
                                                    }}
                                                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 hover:text-primary transition-colors border-l border-gray-200"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={item.price}
                                                    onChange={(e) => handleItemChange(item.id, 'price', Number(e.target.value))}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-right"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className={`p-2 rounded-lg transition-colors ${items.length > 1 ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
                                                disabled={items.length <= 1}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                            
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="text-sm text-primary font-medium hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                >
                                    <Plus size={16} /> Add Item
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Fees & Total & Action */}
                    <div className="lg:col-span-4 space-y-8 lg:space-y-6">
                        {/* Section 3: Fees & Total */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold border-b border-gray-100 pb-2">
                                <Receipt size={20} />
                                <h3>Payment & Notes</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    {/* Date & Time Selection */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={orderDate}
                                                onChange={(e) => setOrderDate(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Time Slot</label>
                                            <div className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-lg transition-all ${showValidation && !deliveryTimeSlot ? 'border-2 border-red-500 bg-red-50' : ''} ${isShake && !deliveryTimeSlot ? 'animate-shake' : ''}`}>
                                                {TIME_SLOTS.map(slot => (
                                                    <button
                                                        key={slot}
                                                        type="button"
                                                        onClick={() => setDeliveryTimeSlot(slot)}
                                                        className={`px-1 py-1.5 text-[10px] sm:text-xs font-medium rounded-md border transition-all ${deliveryTimeSlot === slot
                                                            ? 'bg-primary text-white border-primary shadow-sm'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                                                            }`}
                                                    >
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Priority Selector */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mức độ ưu tiên
                                            </label>
                                            <div className="flex gap-2">
                                                {[
                                                    { value: 'high', label: 'Gấp', color: 'red' },
                                                    { value: 'normal', label: 'Bình thường', color: 'gray' },
                                                    { value: 'low', label: 'Thấp', color: 'gray' }
                                                ].map(p => (
                                                    <button
                                                        key={p.value}
                                                        type="button"
                                                        onClick={() => setPriority(p.value)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                                                            priority === p.value
                                                                ? p.value === 'high'
                                                                    ? 'bg-red-100 border-red-300 text-red-700'
                                                                    : 'bg-primary/10 border-primary/30 text-primary'
                                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {p.value === 'high' && <AlertCircle size={12} />}
                                                        {p.value === 'low' && <ArrowDown size={12} />}
                                                        {p.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Note <span className="text-gray-400 font-normal">(Optional)</span></label>
                                        <textarea
                                            rows="2"
                                            value={orderNote}
                                            onChange={(e) => setOrderNote(e.target.value)}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                            placeholder="Ghi chú cho đơn hàng..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-600">Ship Fee</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={fees.ship}
                                            onChange={(e) => setFees({ ...fees, ship: e.target.value })}
                                            className="w-32 px-2 py-1 bg-white border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-gray-600">Discount (%)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={fees.discount}
                                                onChange={(e) => {
                                                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                                                    setFees({ ...fees, discount: val });
                                                }}
                                                className="w-16 px-2 py-1 bg-white border border-gray-200 rounded text-right text-sm focus:outline-none focus:border-primary text-red-500"
                                            />
                                            <span className="text-sm text-red-500 font-medium min-w-[80px] text-right">
                                                -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * fees.discount) / 100)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                                        <span className="font-bold text-gray-900">Total</span>
                                        <span className="font-bold text-xl text-primary">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(calculateTotal())}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 lg:border-t-0 lg:pt-0">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/30 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        {editingOrder ? 'Update Order' : 'Create Order'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Confirm Discard Modal */}
                {showConfirm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] rounded-2xl">
                        <div className="bg-white p-6 rounded-xl shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-3">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1">Discard Changes?</h3>
                                <p className="text-sm text-gray-500 mb-4">You have unsaved changes. Are you sure you want to close?</p>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/30"
                                    >
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                        )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CreateOrderModal;
