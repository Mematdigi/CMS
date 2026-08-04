import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  turbopack: {
    // The Exotel WebRTC SDK's SIP library (@exotel-npm-dev/webrtc-core-sdk) requires
    // .wav ringtone/beep files directly; Turbopack has no built-in handler for audio assets.
    rules: {
      "*.wav": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
