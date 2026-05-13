import {
  changePassword,
  currentUser,
  deleteOwnAccount,
  logoutAll,
  setPassword,
  updateProfile,
} from "../lib/api";

export const authService = {
  async me() {
    return { data: await currentUser() };
  },
  async updateProfile(payload: Parameters<typeof updateProfile>[0]) {
    return { data: await updateProfile(payload) };
  },
  async changePassword(payload: Parameters<typeof changePassword>[0]) {
    return { data: await changePassword(payload) };
  },
  async setPassword(payload: Parameters<typeof setPassword>[0]) {
    return { data: await setPassword(payload) };
  },
  async deleteOwnAccount() {
    return { data: await deleteOwnAccount() };
  },
  async logoutAll() {
    return { data: await logoutAll() };
  },
};
