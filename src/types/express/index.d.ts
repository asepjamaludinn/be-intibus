import "express";

declare global {
  namespace Express {
    interface Request {
      device?: {
        id: string;
        deviceId: string;
        name: string | null;
      };
    }
  }
}
