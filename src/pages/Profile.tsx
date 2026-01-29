import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, User, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Profile = () => {
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const handleSave = () => {
        // Implement password change logic here
        console.log('Update password', passwords);
    };

    return (
        <div className="min-h-screen bg-background pb-32 pt-20 px-6">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold">Profile</h1>
            </div>

            <div className="flex flex-col items-center mb-8">
                <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <User className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold">{user?.username || 'User'}</h2>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Username</label>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="text-foreground">{user?.username}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <span className="text-foreground">{user?.email || 'No email linked'}</span>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                    <div className="space-y-4">
                        <Input
                            type="password"
                            placeholder="Current Password"
                            value={passwords.current}
                            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        />
                        <Input
                            type="password"
                            placeholder="New Password"
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                        />
                        <Input
                            type="password"
                            placeholder="Confirm New Password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                        />
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleSave} className="w-full">Update Password</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
