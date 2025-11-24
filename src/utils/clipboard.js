
export const copyToClipboard = async (text) => {
    if (!text) return;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Haptic feedback if supported
        if (navigator.vibrate) {
            navigator.vibrate(50); // Short vibration
        }
        
        // Optional: We could return true to indicate success if the caller wants to show a toast
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
};
