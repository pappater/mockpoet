import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let appInstance = null;
let authInstance = null;

function getFirebaseAuth() {
  if (!firebaseConfig?.apiKey) return null;
  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }
  return authInstance;
}

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
provider.addScope('https://www.googleapis.com/auth/gmail.send');

// Access token kept strictly in memory (never localStorage/sessionStorage)
let cachedAccessToken = null;
let isSigningIn = false;

export function initAuth(onAuthChange) {
  const auth = getFirebaseAuth();
  if (!auth) {
    onAuthChange({ user: null, accessToken: null });
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      onAuthChange({ user, accessToken: cachedAccessToken });
    } else if (!isSigningIn) {
      cachedAccessToken = null;
      onAuthChange({ user: null, accessToken: null });
    }
  });
}

export async function googleSignIn() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Google Sign-In is not configured for this environment.');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } finally {
    isSigningIn = false;
  }
}

export async function googleSignOut() {
  const auth = getFirebaseAuth();
  cachedAccessToken = null;
  if (auth) {
    await signOut(auth);
  }
}

export function getAccessToken() {
  return cachedAccessToken;
}

function encodeBase64UrlUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Send a digest email via Gmail API using the signed-in user's OAuth token.
 * Must only be invoked after explicit user confirmation in the UI.
 */
export async function sendGmailDigest({ accessToken, toEmail, subject, htmlBody, plainText }) {
  if (!accessToken) {
    throw new Error('Please sign in with Google again to authorize Gmail sending.');
  }
  if (!toEmail) {
    throw new Error('No recipient email address specified.');
  }

  const boundary = `mockpoet_boundary_${Date.now()}`;
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const rawMime = [
    `To: ${toEmail}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    plainText || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody || '',
    '',
    `--${boundary}--`,
  ].join('\r\n');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodeBase64UrlUtf8(rawMime),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${errText}`);
  }

  return res.json();
}
