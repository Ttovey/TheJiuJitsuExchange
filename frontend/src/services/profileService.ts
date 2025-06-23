const API_BASE = '/api';

export const profileService = {
  // Upload profile picture
  async uploadProfilePicture(file: File): Promise<{ message: string; profile_picture: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/upload-profile-picture`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload profile picture');
    }

    return response.json();
  },

  // Get profile picture URL
  getProfilePictureUrl(filename: string | undefined): string | null {
    if (!filename) return null;
    return `${API_BASE}/profile-picture/${filename}`;
  },

  // Delete profile picture
  async deleteProfilePicture(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE}/delete-profile-picture`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete profile picture');
    }

    return response.json();
  },
}; 