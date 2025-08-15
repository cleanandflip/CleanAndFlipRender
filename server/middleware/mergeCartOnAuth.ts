import { mergeSessionCartIntoUser } from "../services/cartService";

export default async function mergeCartOnAuth(req: any, _res: any, next: any) {
  try {
    if (req.user && req.session && !req.session.__cartMerged) {
      await mergeSessionCartIntoUser(req.sessionID, req.user.id);
      req.session.__cartMerged = true; // only once per session
    }
    next();
  } catch (e) { 
    next(e); 
  }
}