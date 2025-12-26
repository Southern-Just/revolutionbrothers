"use server";

import ImageKit from "imagekit";
import { updateMyProfile } from "@/lib/actions/user.systeme";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function uploadProfileImage(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await imagekit.upload({
    file: buffer,
    fileName: `profile_${Date.now()}`,
  });

  await updateMyProfile({ profileImage: result.url });
  return result.url;
}
