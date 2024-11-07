// lib/auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { postData } from './svt_utils';
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from './constants';

export const signUp = async (email: string, password: string) => {
  var res = createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
    var user = userCredential.user;
    const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
    postData({endpoint: `${url}/svt_api/webhook`,
      data: {
        scope: "google_signin",
        result: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        }
      }
    })
    console.log(userCredential);
  });
  return res;
};

export const signIn = async (email: string, password: string) => {
  var res = signInWithEmailAndPassword(auth, email, password).then((userCredential) => {
    var user = userCredential.user;
    const url = `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}`
    postData({endpoint: `${url}/svt_api/webhook`,
      data: {
        scope: "google_signin",
        result: {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email,
        }
      }
    })
    console.log(userCredential);
  });

  console.log(res)

  return res;
};

export const logOut = async () => {
  return signOut(auth);
};
