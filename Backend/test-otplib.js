const otplib = require('otplib');
const { generateSecret, verify, generate } = otplib;

console.log('Testing otplib exports directly...');

const secret = generateSecret();
// generate might need different arguments or might not be what I think.
// Let's try to find how to generate a token with the available exports.
// If 'totp' or 'authenticator' are not exported, maybe they are default?
// But previously 'Exports' list didn't show 'default'.

// Let's print otplib again just in case
// console.log(otplib);

// Try to use TOTP class if available
const { TOTP } = otplib;
let token;
if (TOTP) {
    const totp = new TOTP();
    token = totp.generate({ secret });
    console.log('Generated token with TOTP class:', token);
} else {
    // try global generate?
    try {
        token = generate(secret);
        console.log('Generated token with generate():', token);
    } catch (e) {
        console.log('generate() failed:', e.message);
    }
}

if (token) {
    (async () => {
        try {
            console.log('Verifying...');
            const result = await verify({ token, secret });
            console.log('Verify Result:', result);
            console.log('Type of Verify Result:', typeof result);

            if (result === true) {
                console.log('Result is boolean true. Code likely expects { valid: boolean }');
            } else if (result && result.valid) {
                console.log('Result has valid property.');
            } else {
                console.log('Result is something else.');
            }

        } catch (e) {
            console.error('Verify Error:', e);
        }
    })();
}
