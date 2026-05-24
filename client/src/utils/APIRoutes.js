const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const defaultHost = isLocalHost ? "http://localhost:5000" : "http://8.137.53.3:5000";

export const host = (import.meta.env.VITE_API_BASE_URL || defaultHost).replace(/\/$/, "");
export const loginRoute = `${host}/api/auth/login`;
export const registerRoute = `${host}/api/auth/register`;
export const allUsersRoute = `${host}/api/auth/allusers`;
export const sendMessageRoute = `${host}/api/messages/addmsg`;
export const recieveMessageRoute = `${host}/api/messages/getmsg`;
export const logoutRoute = `${host}/api/auth/logout`;
export const uploadRoute = `${host}/api/upload`;
