import {
  AuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { FC, useState } from "react";

import Alert from "../components/Alert";
import { Navigate } from "react-router-dom";
import { auth } from "../shared/firebase";
import { useQueryParams } from "../hooks/useQueryParams";
import { useStore } from "../store";

const SignIn: FC = () => {
  const { redirect } = useQueryParams();

  const currentUser = useStore((state) => state.currentUser);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAlertOpened, setIsAlertOpened] = useState(false);

  const handleSignIn = (provider: AuthProvider) => {
    setLoading(true);

    signInWithPopup(auth, provider)
      .then((res) => {
        console.log(res.user);
      })
      .catch((err) => {
        setIsAlertOpened(true);
        setError(`Error: ${err.code}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (currentUser) return <Navigate to={redirect || "/"} />;

  return (
    <>
      <div className="mx-[5vw] my-5 flex justify-center lg:my-10">
        <div className="w-full max-w-[1100px]">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <img className="w-8 h-8" src="/icon.png" alt="" />
              <span className="text-2xl">QuickChat</span>
            </div>
            <a
              href="https://github.com/trungnguyenhuynhminh46/quickchat"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xl"
            >
              <i className="bx bxl-github"></i>
              <span>Github</span>
            </a>
          </div>

          <div className="flex flex-col-reverse items-center gap-10 md:mt-5 md:flex-row md:gap-5 lg:mt-10">
            <div className="basis-1/3">
              <img
                className="w-full h-auto rounded-full"
                src="/cat-computer.gif"
                alt=""
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4 basis-2/3 md:items-start">
              <h1 className="text-3xl text-center md:text-left md:text-4xl">
                Have your best chat
              </h1>
              <p className="text-xl text-center md:text-left md:text-2xl">
                Fast, easy and unlimited chat. Chat with anyone anytime.
              </p>

              <button
                disabled={loading}
                onClick={() => handleSignIn(new GoogleAuthProvider())}
                className="flex min-w-[250px] cursor-pointer items-center gap-3 rounded-md bg-white p-3 text-black transition duration-300 hover:brightness-90 disabled:!cursor-default disabled:!brightness-75"
              >
                <img className="w-6 h-6" src="/google.svg" alt="" />

                <span>Sign In With Google</span>
              </button>

              <button
                disabled={loading}
                onClick={() => handleSignIn(new FacebookAuthProvider())}
                className="bg-primary flex min-w-[250px] cursor-pointer items-center gap-3 rounded-md p-3 text-white transition duration-300 hover:brightness-90 disabled:!cursor-default disabled:!brightness-75"
              >
                <img className="w-6 h-6" src="/facebook.svg" alt="" />

                <span>Sign In With Facebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Alert
        isOpened={isAlertOpened}
        setIsOpened={setIsAlertOpened}
        text={error}
        isError
      />
    </>
  );
};

export default SignIn;
