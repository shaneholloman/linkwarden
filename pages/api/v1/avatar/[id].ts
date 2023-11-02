import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/api/db";
import readFile from "@/lib/api/storage/readFile";
import authenticateUser from "@/lib/api/authenticateUser";

export default async function Index(req: NextApiRequest, res: NextApiResponse) {
  const queryId = Number(req.query.id);

  const user = await authenticateUser({ req, res });
  if (!user) return res.status(404).json({ response: "User not found." });

  if (!queryId)
    return res
      .setHeader("Content-Type", "text/plain")
      .status(401)
      .send("Invalid parameters.");

  if (user.id !== queryId) {
    const targetUser = await prisma.user.findUnique({
      where: {
        id: queryId,
      },
      include: {
        whitelistedUsers: true,
      },
    });

    const whitelistedUsernames = targetUser?.whitelistedUsers.map(
      (whitelistedUsername) => whitelistedUsername.username
    );

    if (
      targetUser?.isPrivate &&
      user.username &&
      !whitelistedUsernames?.includes(user.username)
    ) {
      return res
        .setHeader("Content-Type", "text/plain")
        .status(400)
        .send("File not found.");
    }
  }

  const { file, contentType, status } = await readFile(
    `uploads/avatar/${queryId}.jpg`
  );

  return res
    .setHeader("Content-Type", contentType)
    .status(status as number)
    .send(file);
}
