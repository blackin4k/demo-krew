import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NotificationPermissionHandler = () => {
    useEffect(() => {
        const requestPermissions = async () => {
            // Only request on native platforms (Android/iOS)
            if (Capacitor.isNativePlatform()) {
                try {
                    const status = await LocalNotifications.checkPermissions();
                    if (status.display !== 'granted') {
                        await LocalNotifications.requestPermissions();
                    }
                } catch (error) {
                    console.error('Error requesting notification permissions:', error);
                }
            }
        };

        requestPermissions();
    }, []);

    return null;
};

export default NotificationPermissionHandler;
