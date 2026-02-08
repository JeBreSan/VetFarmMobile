// api/src/middlewares/requireUser.js

export function requireUser(req, res, next) {
  const id = Number(req.headers["x-user-id"]);
  const rolHeader = req.headers["x-user-rol"];

  if (!id || id <= 0) {
    return res.status(401).json({
      mensaje: "No autorizado. Usuario no identificado.",
    });
  }

  const rol = rolHeader === "admin" ? "admin" : "usuario";

  req.user = { id, rol };
  next();
}
