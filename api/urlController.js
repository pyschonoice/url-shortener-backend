    const crypto = require("crypto");
    const { z } = require("zod");
    const {storeModel} = require("../db");
    const URL = process.env.URL;


    //base62 encoder
    const encodingFunc = (hexStr) => {
    const referenceTable =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let num = BigInt("0x" + hexStr); //helps us get hex to number to encode this
    let encoded = "";
    while (num) {
        encoded += referenceTable[parseInt(num % 62n)]; // get the corresponding number value from the ref table
        num = num / 62n;
    }

    return encoded;
    };

    async function urlCreate(req, res) {
    try {
        let userId;
        if(req.userId) userId  = req.userId;
        const { orgUrl , expiresIn , isActive} = req.body
        if (!orgUrl) return res.status(400).json({ message: "No url found." });

        const urlinDb = await storeModel.findOne({ longUrl: orgUrl });
        if (urlinDb)
        return res
            .status(200)
            .json({ message: "Already in DB", shortUrl: urlinDb.shortUrl });

        const hash = crypto.createHash("sha256").update(orgUrl).digest("hex");
        const encoded = encodingFunc(hash);
        const shortUrlHash = encoded.slice(0, 7); // get 7 digits
        const shortUrl = URL + shortUrlHash;

        const storedDoc = new storeModel({
        longUrl: orgUrl,
        shortUrl,
        expiresIn : expiresIn,
        isActive: isActive,
        userId
        });
        const storedData = await storedDoc.save();
        res
        .status(201)
        .json({ message: "Created url.", shortUrl: storedData.shortUrl });
    } catch (err) {
        return res
        .status(500)
        .json({ error: "Internal Server Error", detail: err });
    }
    }

    async function urlRedirect(req, res) {
    try {
        const shortUrlHash = req.params.url;
        const shortUrl = URL + shortUrlHash;
        const result = await storeModel.findOne({ shortUrl });
        if (!result) return res.status(404).json({ message: "Invalid short url" });
        if (!result.isActive)
        return res.status(403).json({ message: "Link not active" });
        const now = new Date();
        if (result.expireAt && result.expireAt < now) {
        return res.status(410).json({ message: "Link has expired" });
        }
        result.clicks += 1;
        await result.save();

        const longUrl = result.longUrl;
        res.redirect(longUrl);
        //return res.status(200).json({longUrl})
    } catch (err) {
        return res
        .status(500)
        .json({ error: "Internal Server Error", detail: err });
    }
    }

    async function urlAnalytics(req, res) {
    try {
        const shortUrlHash = req.params.url;
        const shortUrl = URL + shortUrlHash;
        const result = await storeModel.findOne({ shortUrl });
        if (!result) return res.status(404).json({ message: "Invalid short url" });
        if (!result.isActive)
        return res.status(403).json({ message: "Link not active" });
        const now = new Date();
        if (result.expireAt && result.expireAt < now) {
        return res.status(410).json({ message: "Link has expired" });
        }

        return res.status(200).json({ clicks: result.clicks });
    } catch (err) {
        return res
        .status(500)
        .json({ error: "Internal Server Error", detail: err });
    }
    }

    module.exports = {
    urlCreate,
    urlRedirect,
    urlAnalytics,
    };
