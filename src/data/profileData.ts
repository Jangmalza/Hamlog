export interface ProfileData {
  name: string;
  bio: string;
  profileImage: string;
  socialLinks: {
    instagram?: string;
    website?: string;
    twitter?: string;
    email?: string;
  };
}

export const profileData: ProfileData = {
  name: "Hamwoo",
  bio: "달을 향해 쏴라, 빗나가도 별이 될테니",
  profileImage: "/avatar.jpg",
  socialLinks: {
    instagram: "https://www.instagram.com/hamwo_o/"
  }
};
