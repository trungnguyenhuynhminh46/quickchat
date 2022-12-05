import {
  ChangeEvent,
  ClipboardEventHandler,
  FC,
  FormEvent,
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../../shared/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import Alert from "../Alert";
import ClickAwayListener from "../ClickAwayListener";
import { EMOJI_REPLACEMENT } from "../../shared/constants";
import GifIcon from "../Icon/GifIcon";
import GifPicker from "./GifPicker";
import ReplyIcon from "../Icon/ReplyIcon";
import Spin from "react-cssfx-loading/lib/Spin";
import StickerIcon from "../Icon/StickerIcon";
import StickerPicker from "./StickerPicker";
import { formatFileName } from "../../shared/utils";
import { useParams } from "react-router-dom";
import { useStore } from "../../store";

const Picker = lazy(() => import("./EmojiPicker"));

interface InputSectionProps {
  disabled: boolean;
  setInputSectionOffset?: (value: number) => void;
  replyInfo?: any;
  setReplyInfo?: (value: any) => void;
}

const InputSection: FC<InputSectionProps> = ({
  disabled,
  setInputSectionOffset,
  replyInfo,
  setReplyInfo,
}) => {
  const [inputValue, setInputValue] = useState("");

  const [fileUploading, setFileUploading] = useState(false);

  const [previewFiles, setPreviewFiles] = useState<string[]>([]);

  const [isStickerPickerOpened, setIsStickerPickerOpened] = useState(false);
  const [isIconPickerOpened, setIsIconPickerOpened] = useState(false);
  const [isGifPickerOpened, setIsGifPickerOpened] = useState(false);

  const [isAlertOpened, setIsAlertOpened] = useState(false);
  const [alertText, setAlertText] = useState("");

  const { id: conversationId } = useParams();
  const currentUser = useStore((state) => state.currentUser);

  const textInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileDragging, setFileDragging] = useState(false);

  const updateTimestamp = () => {
    updateDoc(doc(db, "conversations", conversationId as string), {
      updatedAt: serverTimestamp(),
    });
  };

  useEffect(() => {
    const handler = () => {
      textInputRef.current?.focus();
    };
    window.addEventListener("focus", handler);
    return () => window.removeEventListener("focus", handler);
  }, []);

  useEffect(() => {
    textInputRef.current?.focus();
  }, [conversationId]);

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (previewFiles.length > 0) {
      setPreviewFiles([]);
      for (let i = 0; i < previewFiles.length; i++) {
        const url = previewFiles[i];
        const res = await fetch(url);
        const blob = await res.blob();
        const file = new File([blob], "image.png", {
          type: res.headers.get("content-type") as string,
        });
        await uploadFile(file);
      }
    } else {
      if (fileUploading) return;
    }

    if (!inputValue.trim()) return;

    setInputValue("");

    let replacedInputValue = ` ${inputValue} `;

    Object.entries(EMOJI_REPLACEMENT).map(([key, value]) => {
      value.forEach((item) => {
        replacedInputValue = replacedInputValue
          .split(` ${item} `)
          .join(` ${key} `);
      });
    });

    setReplyInfo && setReplyInfo(null);

    addDoc(
      collection(db, "conversations", conversationId as string, "messages"),
      {
        sender: currentUser?.uid,
        content: replacedInputValue.trim(),
        type: "text",
        createdAt: serverTimestamp(),
        replyTo: replyInfo?.id || null,
      }
    );

    updateTimestamp();
  };

  const sendSticker = (url: string) => {
    addDoc(
      collection(db, "conversations", conversationId as string, "messages"),
      {
        sender: currentUser?.uid,
        content: url,
        type: "sticker",
        createdAt: serverTimestamp(),
      }
    );

    updateTimestamp();
  };

  const uploadFile = async (file: File) => {
    try {
      const TWENTY_MB = 1024 * 1024 * 20;

      if (file.size > TWENTY_MB) {
        setAlertText("Max file size is 20MB");
        setIsAlertOpened(true);
        return;
      }

      setFileUploading(true);

      const fileReference = ref(storage, formatFileName(file.name));

      await uploadBytes(fileReference, file);

      const downloadURL = await getDownloadURL(fileReference);

      addDoc(
        collection(db, "conversations", conversationId as string, "messages"),
        {
          sender: currentUser?.uid,
          content: downloadURL,
          type: file.type.startsWith("image") ? "image" : "file",
          file: file.type.startsWith("image")
            ? null
            : {
                name: file.name,
                size: file.size,
              },
          createdAt: serverTimestamp(),
        }
      );

      setFileUploading(false);
      updateTimestamp();
    } catch (error) {
      console.log(error);
      setFileUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    uploadFile(file);
  };

  const addIconToInput = (value: string) => {
    const start = textInputRef.current?.selectionStart as number;
    const end = textInputRef.current?.selectionEnd as number;
    const splitted = inputValue.split("");
    splitted.splice(start, end - start, value);
    setInputValue(splitted.join(""));
  };

  const handleReplaceEmoji = (e: any) => {
    if (e.key === " ") {
      if (e.target.selectionStart !== e.target.selectionEnd) return;

      const lastWord = inputValue
        .slice(0, e.target.selectionStart)
        .split(" ")
        .slice(-1)[0];

      if (lastWord.length === 0) return;

      Object.entries(EMOJI_REPLACEMENT).map(([key, value]) => {
        value.forEach((item) => {
          if (item === lastWord) {
            const splitted = inputValue.split("");
            splitted.splice(
              e.target.selectionStart - lastWord.length,
              lastWord.length,
              key
            );
            setInputValue(splitted.join(""));
          }
        });
      });
    }
  };

  const sendGif = (url: string) => {
    addDoc(
      collection(db, "conversations", conversationId as string, "messages"),
      {
        sender: currentUser?.uid,
        content: url,
        type: "image",
        file: null,
        createdAt: serverTimestamp(),
      }
    );
  };

  useEffect(() => {
    if (!setInputSectionOffset) return;
    if (previewFiles.length > 0) return setInputSectionOffset(128);

    if (!!replyInfo) return setInputSectionOffset(76);

    setInputSectionOffset(0);
  }, [previewFiles.length, replyInfo]);

  const handlePaste: ClipboardEventHandler<HTMLInputElement> = (e) => {
    const file = e?.clipboardData?.files?.[0];
    if (!file || !file.type.startsWith("image")) return;

    const url = URL.createObjectURL(file);

    setPreviewFiles([...previewFiles, url]);
  };

  useEffect(() => {
    const dragBlurHandler = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setFileDragging(false);
    };

    const dragFocusHandler = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setFileDragging(true);
    };

    const dropFileHandler = async (e: any) => {
      e.preventDefault();
      e.stopPropagation();

      setFileDragging(false);

      let items = e.dataTransfer.items;
      let files = e.dataTransfer.files;

      let selectedFiles = [];

      for (let i = 0, item; (item = items[i]); ++i) {
        let entry = item.webkitGetAsEntry();
        if (entry.isFile) {
          selectedFiles.push(files[i]);
        }
      }

      for (let i = 0; i < selectedFiles.length; i++) {
        await uploadFile(selectedFiles[i]);
      }
    };

    addEventListener("dragenter", dragFocusHandler);
    addEventListener("dragover", dragFocusHandler);
    addEventListener("dragleave", dragBlurHandler);
    addEventListener("drop", dropFileHandler);

    return () => {
      removeEventListener("dragenter", dragFocusHandler);
      removeEventListener("dragover", dragFocusHandler);
      removeEventListener("dragleave", dragBlurHandler);
      removeEventListener("drop", dropFileHandler);
    };
  }, []);

  return (
    <>
      {fileDragging && (
        <div className="fixed top-0 left-0 z-20 flex items-center justify-center w-full h-full pointer-events-none select-none backdrop-blur-sm">
          <h1 className="text-3xl">Drop file to send</h1>
        </div>
      )}
      {previewFiles.length > 0 && (
        <div className="flex items-center h-32 gap-2 px-4 border-t border-dark-lighten">
          {previewFiles.map((preview) => (
            <div key={preview} className="relative">
              <img className="object-cover h-28 w-28" src={preview} alt="" />
              <button
                onClick={() =>
                  setPreviewFiles(
                    previewFiles.filter((item) => item !== preview)
                  )
                }
                className="absolute flex items-center justify-center w-4 h-4 bg-gray-100 rounded-full top-1 right-1"
              >
                <i className="text-lg bx bx-x text-dark"></i>
              </button>
            </div>
          ))}
        </div>
      )}
      {previewFiles.length === 0 && !!replyInfo && (
        <div className="border-dark-lighten flex h-[76px] justify-between border-t p-4">
          <div>
            <div className="flex items-center gap-2">
              <ReplyIcon />
              <p>
                Replying
                {currentUser?.uid === replyInfo.sender ? " to yourself" : ""}
              </p>
            </div>
            {replyInfo.type === "text" ? (
              <p className="max-w-[calc(100vw-65px)] overflow-hidden text-ellipsis whitespace-nowrap md:max-w-[calc(100vw-420px)]">
                {replyInfo.content}
              </p>
            ) : replyInfo.type === "image" ? (
              "An image"
            ) : replyInfo.type === "file" ? (
              "A file"
            ) : replyInfo.type === "sticker" ? (
              "A sticker"
            ) : (
              "Message has been removed"
            )}
          </div>

          <button onClick={() => setReplyInfo && setReplyInfo(null)}>
            <i className="text-3xl bx bx-x"></i>
          </button>
        </div>
      )}
      <div
        className={`border-dark-lighten flex h-16 items-stretch gap-1 border-t px-4 ${
          disabled ? "pointer-events-none select-none" : ""
        }`}
      >
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center flex-shrink-0 text-2xl text-primary"
        >
          <i className="bx bxs-image-add"></i>
        </button>
        <input
          ref={imageInputRef}
          hidden
          className="hidden"
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center flex-shrink-0 text-2xl text-primary"
        >
          <i className="bx bx-link-alt"></i>
        </button>
        <input
          ref={fileInputRef}
          hidden
          className="hidden"
          type="file"
          onChange={handleFileInputChange}
        />
        <div className="relative flex items-center flex-shrink-0">
          {isStickerPickerOpened && (
            <StickerPicker
              setIsOpened={setIsStickerPickerOpened}
              onSelect={sendSticker}
            />
          )}

          <button
            onClick={() => setIsStickerPickerOpened(true)}
            className="flex items-center"
          >
            <StickerIcon />
          </button>
        </div>

        <div className="relative flex items-center flex-shrink-0">
          {isGifPickerOpened && (
            <GifPicker setIsOpened={setIsGifPickerOpened} onSelect={sendGif} />
          )}

          <button
            onClick={() => setIsGifPickerOpened(true)}
            className="flex items-center"
          >
            <GifIcon />
          </button>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="flex items-stretch flex-grow gap-1"
        >
          <div className="relative flex items-center flex-grow">
            <input
              maxLength={1000}
              disabled={disabled}
              ref={textInputRef}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
              }}
              onKeyDown={handleReplaceEmoji}
              onPaste={handlePaste}
              className="w-full pl-3 pr-10 rounded-full outline-none bg-dark-lighten h-9"
              type="text"
              placeholder="Message..."
            />
            <button
              type="button"
              onClick={() => setIsIconPickerOpened(true)}
              className="absolute -translate-y-1/2 right-2 top-1/2"
            >
              <i className="text-2xl bx bxs-smile text-primary"></i>
            </button>

            {isIconPickerOpened && (
              <ClickAwayListener
                onClickAway={() => setIsIconPickerOpened(false)}
              >
                {(ref) => (
                  <div ref={ref} className="absolute right-0 bottom-full">
                    <Suspense
                      fallback={
                        <div className="flex h-[357px] w-[348px] items-center justify-center rounded-lg border-2 border-[#555453] bg-[#222222]">
                          <Spin />
                        </div>
                      }
                    >
                      <Picker
                        onSelect={(emoji: any) => addIconToInput(emoji.native)}
                      />
                    </Suspense>
                  </div>
                )}
              </ClickAwayListener>
            )}
          </div>
          {fileUploading ? (
            <div className="flex items-center ml-1">
              <Spin width="24px" height="24px" color="#0D90F3" />
            </div>
          ) : (
            <button className="flex items-center flex-shrink-0 text-2xl text-primary">
              <i className="bx bxs-send"></i>
            </button>
          )}
        </form>
      </div>

      <Alert
        isOpened={isAlertOpened}
        setIsOpened={setIsAlertOpened}
        text={alertText}
        isError
      />
    </>
  );
};

export default InputSection;
