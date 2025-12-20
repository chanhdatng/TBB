import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Save, Loader2, AlertCircle } from 'lucide-react';
import { database } from '../../firebase';
import { ref, set } from "firebase/database";
import { scaleVariants, backdropVariants } from '../../utils/animations';

// Sanitize HTML to prevent XSS
const sanitizeHTML = (str) => {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

const AddProductModal = ({ isOpen, onClose, onProductAdded, addToast }) => {
    // Debug addToast
    console.log('AddProductModal addToast prop:', typeof addToast);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        price: '',
        cost: '',
        code: '',
        style: '',
        id: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);

    // Cleanup image preview on unmount
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    // Available product types
    const PRODUCT_TYPES = [
        'Bánh kem (Cake)',
        'Bánh mì (Bread)',
        'Canele',
        'Shiopan',
        'Cookie',
        'Brownie',
        'Croissant',
        'Cupcake',
        'Pastry',
        'Khác (Other)'
    ];

    // Available product styles/types
    const PRODUCT_STYLES = [
        'Classic',
        'Modern',
        'Traditional',
        'Fusion',
        'Artisan',
        'Organic',
        'Luxury',
        'Casual',
        'Seasonal',
        'Limited Edition'
    ];

    // Generate unique ID similar to MongoDB ObjectId
    const generateUniqueId = () => {
        const timestamp = Date.now().toString(16); // Convert timestamp to hex
        const randomBytes = Array.from({ length: 16 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
        return timestamp + randomBytes;
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    // Handle image selection
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setError('');
        setImageFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Remove selected image
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Upload image to server
    const uploadImage = async () => {
        if (!imageFile) return null;

        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await fetch('/api/upload-product-image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to upload image');
        }

        const data = await response.json();
        return data.imageUrl;
    };

    // Validate form
    const validateForm = () => {
        // Validate name
        if (!formData.name.trim()) {
            setError('Product name is required');
            return false;
        }
        if (formData.name.trim().length > 100) {
            setError('Product name must be less than 100 characters');
            return false;
        }

        // Validate type
        if (!formData.type) {
            setError('Product type is required');
            return false;
        }

        // Validate price
        const price = parseFloat(formData.price);
        if (!formData.price || isNaN(price) || price < 0) {
            setError('Please enter a valid price (minimum 0)');
            return false;
        }
        if (price > 999999999) {
            setError('Price cannot exceed 999,999,999 VND');
            return false;
        }

        // Validate cost
        const cost = parseFloat(formData.cost);
        if (formData.cost && (isNaN(cost) || cost < 0)) {
            setError('Cost must be a positive number');
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSaving(true);
        setError('');

        try {
            // Upload image if selected
            let imageUrl = null;
            if (imageFile) {
                setIsUploading(true);
                imageUrl = await uploadImage();
                setIsUploading(false);
            }

            // Validate product code is required
            if (!formData.code.trim()) {
                setError('Product code is required as it will be used as ID');
                return;
            }

            // Generate unique ID if not provided
            const productId = formData.id.trim() || generateUniqueId();

            // Create product object with sanitized data
            const productData = {
                id: productId,
                name: sanitizeHTML(formData.name.trim()),
                type: sanitizeHTML(formData.type),
                price: parseFloat(formData.price),
                cost: parseFloat(formData.cost) || 0,
                code: sanitizeHTML(formData.code.trim()),
                style: sanitizeHTML(formData.style),
                image: imageUrl
            };

            // Save to Firebase with product code as ID
            const productsRef = ref(database, `cakes/${formData.code.trim()}`);
            await set(productsRef, productData);

            // Success callback
            if (typeof addToast === 'function') {
                addToast('Product added successfully!', 'success');
            }
            onProductAdded?.(productData);
            onClose();

            // Reset form
            setFormData({
                name: '',
                type: '',
                price: '',
                cost: '',
                code: '',
                style: '',
                id: ''
            });
            setImageFile(null);
            setImagePreview(null);

        } catch (err) {
            if (typeof addToast === 'function') {
                addToast(err.message || 'Failed to create product', 'error');
            }
            setError(err.message || 'Failed to create product');
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    };

    // Handle modal close
    const handleClose = () => {
        if (isSaving || isUploading) return;
        onClose();
        setError('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        variants={scaleVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={isSaving || isUploading}
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg">
                                    <AlertCircle size={20} />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Chocolate Cake"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                    maxLength={100}
                                    aria-label="Product name"
                                    aria-describedby="name-error"
                                />
                            </div>

                            {/* Product ID and Code */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product ID
                                    </label>
                                    <input
                                        type="text"
                                        name="id"
                                        value={formData.id}
                                        onChange={handleInputChange}
                                        placeholder="Auto-generated (e.g., 690285c0a7527fc2b20e5699)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        maxLength={24}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Code <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        placeholder="e.g., CAKE001 (used as Firebase ID)"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        maxLength={50}
                                    />
                                </div>
                            </div>

                            {/* Style */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Style
                                </label>
                                <input
                                    type="text"
                                    name="style"
                                    value={formData.style}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Modern, Classic, Artisan"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    maxLength={100}
                                />
                            </div>

                            {/* Product Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Type <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Cake, Bread, Pastry"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                    maxLength={100}
                                />
                            </div>

                            {/* Price */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>

                            {/* Cost */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cost (VND)
                                </label>
                                <input
                                    type="number"
                                    name="cost"
                                    value={formData.cost}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Product Image
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                                    <div className="space-y-1 text-center">
                                        {imagePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Product preview"
                                                    className="mx-auto h-64 w-64 object-cover rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label
                                                        htmlFor="image-upload"
                                                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-light"
                                                    >
                                                        <span>Upload a file</span>
                                                        <input
                                                            ref={fileInputRef}
                                                            id="image-upload"
                                                            type="file"
                                                            className="sr-only"
                                                            accept="image/*"
                                                            onChange={handleImageSelect}
                                                        />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    PNG, JPG, GIF up to 5MB
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={isSaving || isUploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium flex items-center justify-center gap-2"
                                    disabled={isSaving || isUploading}
                                >
                                    {isSaving || isUploading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            {isUploading ? 'Uploading...' : 'Saving...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Add Product
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddProductModal;