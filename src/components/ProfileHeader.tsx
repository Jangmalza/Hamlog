import React from 'react';
import type { ProfileData } from '../data/profileData';

interface ProfileHeaderProps {
  profile: ProfileData;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => (
  <section className="border-b border-gray-200 bg-white">
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start">
      {profile.profileImage && (
        <img
          src={profile.profileImage}
          alt={`${profile.name} profile image`}
          className="h-28 w-28 rounded-md border border-gray-200 object-cover"
          loading="eager"
        />
      )}

      <div className="flex-1 space-y-4 text-center sm:text-left">
        <h2 className="text-xl font-medium text-gray-900 sm:text-2xl">{profile.name}</h2>
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          {profile.bio}
        </p>
        {profile.socialLinks.instagram && (
          <div className="flex flex-wrap justify-center gap-3 text-xs uppercase tracking-wide text-gray-600 sm:justify-start">
            <a
              href={profile.socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-gray-300 px-3 py-1 transition hover:bg-gray-100"
            >
              Instagram
            </a>
          </div>
        )}
      </div>
    </div>
  </section>
);

export default ProfileHeader;
