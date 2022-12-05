import { FC, useState } from "react";
import { IMAGE_PROXY, THEMES } from "../../shared/constants";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import Spin from "react-cssfx-loading/lib/Spin";
import { db } from "../../shared/firebase";
import { useCollectionQuery } from "../../hooks/useCollectionQuery";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store";

interface CreateConversationProps {
  setIsOpened: (value: boolean) => void;
}

const CreateConversation: FC<CreateConversationProps> = ({ setIsOpened }) => {
  const { data, error, loading } = useCollectionQuery(
    "all-users",
    collection(db, "users")
  );

  const [isCreating, setIsCreating] = useState(false);

  const currentUser = useStore((state) => state.currentUser);

  const [selected, setSelected] = useState<string[]>([]);

  const navigate = useNavigate();

  const handleToggle = (uid: string) => {
    if (selected.includes(uid)) {
      setSelected(selected.filter((item) => item !== uid));
    } else {
      setSelected([...selected, uid]);
    }
  };

  const handleCreateConversation = async () => {
    setIsCreating(true);

    const sorted = [...selected, currentUser?.uid].sort();

    const q = query(
      collection(db, "conversations"),
      where("users", "==", sorted)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const created = await addDoc(collection(db, "conversations"), {
        users: sorted,
        group:
          sorted.length > 2
            ? {
                admins: [currentUser?.uid],
                groupName: null,
                groupImage: null,
              }
            : {},
        updatedAt: serverTimestamp(),
        seen: {},
        theme: THEMES[0],
      });

      setIsCreating(false);

      setIsOpened(false);

      navigate(`/${created.id}`);
    } else {
      setIsOpened(false);

      navigate(`/${querySnapshot.docs[0].id}`);

      setIsCreating(false);
    }
  };

  return (
    <div
      onClick={() => setIsOpened(false)}
      className="fixed top-0 left-0 z-20 flex h-full w-full items-center justify-center bg-[#00000080]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-dark mx-3 w-full max-w-[500px] overflow-hidden rounded-lg"
      >
        <div className="flex items-center justify-between px-3 py-3 border-b border-dark-lighten">
          <div className="flex-1"></div>
          <div className="flex items-center justify-center flex-1">
            <h1 className="text-2xl text-center whitespace-nowrap">
              New conversation
            </h1>
          </div>
          <div className="flex items-center justify-end flex-1">
            <button
              onClick={() => setIsOpened(false)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-dark-lighten"
            >
              <i className="text-2xl bx bx-x"></i>
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Spin color="#0D90F3" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-center">Something went wrong</p>
          </div>
        ) : (
          <>
            {isCreating && (
              <div className="absolute top-0 left-0 z-20 flex h-full w-full items-center justify-center bg-[#00000080]">
                <Spin color="#0D90F3" />
              </div>
            )}
            <div className="flex flex-col items-stretch gap-2 py-2 overflow-y-auto h-96">
              {data?.docs
                .filter((doc) => doc.data().uid !== currentUser?.uid)
                .map((doc) => (
                  <div
                    key={doc.data().uid}
                    onClick={() => handleToggle(doc.data().uid)}
                    className="flex items-center gap-2 px-5 py-2 transition cursor-pointer hover:bg-dark-lighten"
                  >
                    <input
                      className="flex-shrink-0 cursor-pointer"
                      type="checkbox"
                      checked={selected.includes(doc.data().uid)}
                      readOnly
                    />
                    <img
                      className="flex-shrink-0 object-cover w-8 h-8 rounded-full"
                      src={IMAGE_PROXY(doc.data().photoURL)}
                      alt=""
                    />
                    <p>{doc.data().displayName}</p>
                  </div>
                ))}
            </div>
            <div className="flex justify-end p-3 border-t border-dark-lighten">
              <button
                disabled={selected.length === 0}
                onClick={handleCreateConversation}
                className="bg-dark-lighten rounded-lg py-2 px-3 transition duration-300 hover:brightness-125 disabled:!brightness-[80%]"
              >
                Start conversation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CreateConversation;
