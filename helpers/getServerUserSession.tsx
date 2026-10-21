import {
  NotAuthenticatedError,
  lecturerUser,
  readSessionEmail,
} from "./getSetServerSession";

export async function getServerUserSession(request: Request) {
  const email = await readSessionEmail(request);
  const configured = process.env.LECTURER_EMAIL?.trim().toLowerCase();
  if (!configured || configured !== email.toLowerCase()) {
    throw new NotAuthenticatedError();
  }
  return { user: lecturerUser(email) };
}
