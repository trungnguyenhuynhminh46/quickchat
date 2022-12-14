import { DEFAULT_AVATAR, IMAGE_PROXY } from "../../shared/constants";
import { FC, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { collection, orderBy, query, where } from "firebase/firestore";

import ClickAwayListener from "../ClickAwayListener";
import { ConversationInfo } from "../../shared/types";
import CreateConversation from "./CreateConversation";
import SelectConversation from "./SelectConversation";
import Spin from "react-cssfx-loading/lib/Spin";
import UserInfo from "./UserInfo";
import { auth } from "../../shared/firebase";
import { db } from "../../shared/firebase";
import { signOut } from "firebase/auth";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useStore } from "../../store";

const SideBar: FC = () => {
  const currentUser = useStore((state) => state.currentUser);

  const [isDropdownOpened, setIsDropdownOpened] = useState(false);
  const [createConversationOpened, setCreateConversationOpened] =
    useState(false);
  const [isUserInfoOpened, setIsUserInfoOpened] = useState(false);

  const { data, error, loading } = useCollectionQuery(
    "conversations",
    query(
      collection(db, "conversations"),
      orderBy("updatedAt", "desc"),
      where("users", "array-contains", currentUser?.uid)
    )
  );

  const location = useLocation();

  return (
    <>
      <div
        className={`border-dark-lighten h-screen flex-shrink-0 overflow-y-auto overflow-x-hidden border-r ${
          location.pathname !== "/"
            ? "hidden w-[350px] md:!block"
            : "w-full md:!w-[350px]"
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-dark-lighten">
          <Link to="/" className="flex items-center gap-1">
            <img className="w-8 h-8" src="/icon.png" alt="" />
            <h1 className="text-xl">QuickChat</h1>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCreateConversationOpened(true)}
              className="w-8 h-8 rounded-full bg-dark-lighten"
            >
              <i className="text-xl bx bxs-edit"></i>
            </button>

            <ClickAwayListener onClickAway={() => setIsDropdownOpened(false)}>
              {(ref) => (
                <div ref={ref} className="relative z-10">
                  <img
                    onClick={() => setIsDropdownOpened((prev) => !prev)}
                    className="object-cover w-8 h-8 rounded-full cursor-pointer"
                    src={
                      currentUser?.photoURL
                        ? IMAGE_PROXY(currentUser.photoURL)
                        : DEFAULT_AVATAR
                    }
                    alt=""
                  />

                  <div
                    className={`border-dark-lighten bg-dark absolute top-full right-0 flex w-max origin-top-right flex-col items-stretch overflow-hidden rounded-md border py-1 shadow-lg transition-all duration-200 ${
                      isDropdownOpened
                        ? "visible scale-100 opacity-100"
                        : "invisible scale-0 opacity-0"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setIsUserInfoOpened(true);
                        setIsDropdownOpened(false);
                      }}
                      className="flex items-center gap-1 px-3 py-1 transition duration-300 hover:bg-dark-lighten"
                    >
                      <i className="text-xl bx bxs-user"></i>
                      <span className="whitespace-nowrap">Profile</span>
                    </button>
                    <button
                      onClick={() => signOut(auth)}
                      className="flex items-center gap-1 px-3 py-1 transition duration-300 hover:bg-dark-lighten"
                    >
                      <i className="text-xl bx bx-log-out"></i>
                      <span className="whitespace-nowrap">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </ClickAwayListener>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-6">
            <Spin />
          </div>
        ) : error ? (
          <div className="flex justify-center my-6">
            <p className="text-center">Something went wrong</p>
          </div>
        ) : data?.empty ? (
          <div className="flex flex-col items-center justify-center my-6">
            <p className="text-center">No conversation found</p>
            <button
              onClick={() => setCreateConversationOpened(true)}
              className="text-center text-primary"
            >
              Create one
            </button>
          </div>
        ) : (
          <div>
            {data?.docs.map((item) => (
              <SelectConversation
                key={item.id}
                conversation={item.data() as ConversationInfo}
                conversationId={item.id}
              />
            ))}
          </div>
        )}
      </div>

      {createConversationOpened && (
        <CreateConversation setIsOpened={setCreateConversationOpened} />
      )}

      <UserInfo isOpened={isUserInfoOpened} setIsOpened={setIsUserInfoOpened} />
    </>
  );
};

export default SideBar;
