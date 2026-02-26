const User = require('../../models/User/User');

class UserService {
    async updateProfile(userId, updateData) {
        // If email is being updated, check if it's already taken
        if (updateData.email) {
            const existingUser = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
            if (existingUser) {
                throw new Error("Email already in use by another account");
            }
        }

        // Handle skill array if it's provided but not an array
        if (updateData.skill !== undefined) {
            updateData.skill = Array.isArray(updateData.skill) ? updateData.skill : [updateData.skill];
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select("-password");

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }
}

module.exports = new UserService();
