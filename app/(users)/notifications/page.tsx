"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-panel flex flex-col items-center gap-4 py-20 text-center"
      >
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bell className="size-6" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            Order updates, offers, and account alerts will appear here.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
