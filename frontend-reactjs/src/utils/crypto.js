import nacl from 'tweetnacl'
import Base64 from 'base64-js'

export const encrypt = (key, dataStringUTF) => {
    const strDecoded = new Uint8Array(decodeUTF8(dataStringUTF))
    const nonce = nacl.randomBytes(24)

    const keyDecoded = decodeUTF8(key)
    const keyBytes = new Uint8Array(32)
    keyBytes.set(keyDecoded, 0)

    const strEncrypted = nacl.box.after(strDecoded, nonce, keyBytes)

    return { encryptedData: encodeBase64(strEncrypted), nonce: encodeBase64(nonce) }
}

export const decrypt = (key, dataStringBase64, nonceBase64) => {
    try {
        const strDecoded = new Uint8Array(decodeBase64(dataStringBase64))

        const nonceDecoded = new Uint8Array(decodeBase64(nonceBase64))

        const keyDecoded = decodeUTF8(key)
        const keyBytes = new Uint8Array(32)
        keyBytes.set(keyDecoded, 0)

        const strDecrypted = nacl.box.open.after(strDecoded, nonceDecoded, keyBytes)

        return {decrypted: encodeUTF8(strDecrypted)}
    } catch (error) {
        return {error: 1}
    }

}

export const generateKey = (length = 24) => {
    const nonce = nacl.randomBytes(length)
    return encodeBase64(nonce)
}



const decodeUTF8 = (str) => {
    var utf8 = [];
    for (var i = 0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                | (str.charCodeAt(i) & 0x3ff))
            utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

export const encodeUTF8 = (data) => { // array of bytes
    var str = '',
        i;

    for (i = 0; i < data.length; i++) {
        var value = data[i];

        if (value < 0x80) {
            str += String.fromCharCode(value);
        } else if (value > 0xBF && value < 0xE0) {
            str += String.fromCharCode((value & 0x1F) << 6 | data[i + 1] & 0x3F);
            i += 1;
        } else if (value > 0xDF && value < 0xF0) {
            str += String.fromCharCode((value & 0x0F) << 12 | (data[i + 1] & 0x3F) << 6 | data[i + 2] & 0x3F);
            i += 2;
        } else {
            // surrogate pair
            var charCode = ((value & 0x07) << 18 | (data[i + 1] & 0x3F) << 12 | (data[i + 2] & 0x3F) << 6 | data[i + 3] & 0x3F) - 0x010000;

            str += String.fromCharCode(charCode >> 10 | 0xD800, charCode & 0x03FF | 0xDC00);
            i += 3;
        }
    }

    return str;
}

export const encodeBase64 = (data) => Base64.fromByteArray(data)

export const decodeBase64 = (str) => Base64.toByteArray(str)