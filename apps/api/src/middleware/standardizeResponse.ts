import { Request, Response, NextFunction } from 'express';

export const standardizeResponse = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body: any) {
    if (body === null) {
      body = {};
    } else if (typeof body === 'object' && body !== null) {
      const sanitize = (obj: any): any => {
        if (obj === null) return '';
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (typeof obj === 'object') {
          const newObj: any = {};
          for (const key in obj) {
            newObj[key] = sanitize(obj[key]);
          }
          return newObj;
        }
        return obj;
      };
      
      // We do not want to deeply sanitize every single array heavily if it's too large, but for standard API responses it's okay.
      // Wait, actually `null` to `""` in deeply nested objects might break things if clients expect `null`.
      // The prompt says: "Estandarizar respuestas (evitar null, devolver \"\" o {})".
      body = sanitize(body);
    }
    
    return originalJson.call(this, body);
  };
  
  next();
};
