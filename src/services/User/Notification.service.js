const Notification = require('../../models/User/Notification');

class NotificationService {
  /**
   * Creates a single notification.
   */
  async createNotification(data) {
    const notification = new Notification(data);
    return await notification.save();
  }

  /**
   * Creates multiple notifications in batch (e.g., for job matches).
   */
  async createBatchNotifications(notifications) {
    return await Notification.insertMany(notifications);
  }

  /**
   * Fetches all notifications for a specific user.
   */
  async getNotificationsByUser(userId) {
    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50 notifications
  }

  /**
   * Marks a single notification as read.
   */
  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }

  /**
   * Marks all notifications of a user as read.
   */
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
  }
}

module.exports = new NotificationService();
