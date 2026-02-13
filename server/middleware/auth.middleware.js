import jwt from 'jsonwebtoken'



export const authUser = async (req, res, next) => {
    try {
        // Check if authorization header exists
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ message: "No authorization header provided" });
        }

        // Check if it's a Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Invalid authorization format. Expected: Bearer <token>" });
        }

        // Extract token
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        console.log("decoded token is", decoded)

        // Attach the decoded token (user data) to the request
        req.user = {
            id: decoded.userId,
            role: decoded.role,
            email: decoded.email
            
        };
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token" });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired" });
        }
        
        return res.status(500).json({ message: "Internal server error" });
    }
};


// Neglects an admin if they are not given the proper requirements.

export const isAdmin = async (req, res, next) => {
    if (!req.user || req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ message: "Forbidden: Insufficient role" });
    }

    next();
};

export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const token = authHeader.split(" ")[1];
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
                    req.user = {
                        id: decoded.userId,
                        role: decoded.role,
                        email: decoded.email,
                    };
                } catch (err) {
                    console.warn("Invalid token, continuing as guest");
                    req.user = null;
                }
            }
        } else {
            req.user = null; // guest
        }

        next();
    } catch (error) {
        console.error("Optional auth error:", error);
        req.user = null;
        next();
    }
};