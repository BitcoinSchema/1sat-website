// import { BAP } from "bap"
import { decryptData, encryptData } from "@/utils/encryption";
import { ExtendedPrivateKey } from "bsv-wasm-web";
import { head } from "lodash";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { FetchStatus } from "../../components/pages";
import { useLocalStorage } from "../../utils/storage";
import { useStorage } from "../storage";

// duymmy class until bap is fixed
class BAP {
  constructor(xprv) {
    this.xprv = xprv;
  }
  importIds(ids) {
    this.ids = ids;
  }
  listIds() {
    return this.ids;
  }
  getId(id) {
    return id;
  }
}

const BapContext = React.createContext(undefined);

const BapProvider = (props) => {
  const [identity, setIdentity] = useLocalStorage(idStorageKey);
  const [decIdentity, setDecIdentity] = useState();
  const [bapProfile, setBapProfile] = useLocalStorage(profileStorageKey);
  const [bapProfileStatus, setBapProfileStatus] = useState(FetchStatus.Loading);
  const [loadIdentityStatus, setLoadIdentityStatus] = useState(
    FetchStatus.Idle
  );
  const [decryptStatus, setDecryptStatus] = useState(FetchStatus.Idle);
  const { setEncryptionKeyFromPassphrase, encryptionKey } = useStorage();

  useEffect(() => {
    const fire = async () => {
      const id = decryptData(identity);

      let bapId = new BAP(id.xprv);
      // console.log("BAP id", id.xprv);
      if (id.ids) {
        bapId.importIds(id.ids);
      }
      let bid = head(bapId.listIds());
      // console.log({ bid });
      id.bapId = bid;
      setDecIdentity(id);
    };

    if (identity && decryptStatus === FetchStatus.Idle && !decIdentity) {
      // console.log("FIRE");
      fire();
    }
  }, [identity, decryptStatus, decIdentity, setDecIdentity]);

  const isValidIdentity = useCallback((decryptedIdString) => {
    const decIdentity = JSON.parse(decryptedIdString);

    let bapId;
    try {
      bapId = new BAP(decIdentity.xprv);
    } catch (e) {
      console.error(e);
      return false;
    }
    if (bapId && decIdentity.ids) {
      bapId.importIds(decIdentity.ids);
    } else {
      return false;
    }

    const ids = bapId.listIds();
    const idy = bapId.getId(ids[0]);

    // TODO: Is there more to validate here?
    if (!idy) {
      return false;
    }
    return true;
  }, []);

  const onFileChange = useCallback(
    async (e) => {
      console.log("File changed", e.target.files[0]);
      setLoadIdentityStatus(FetchStatus.Loading);

      const file = head(e.target.files);
      const text = await toText(file);

      console.log({ text });
      if (!isValidIdentity(text)) {
        console.log("error: invalid identity file");
        setLoadIdentityStatus(FetchStatus.Error);
        return;
      }

      try {
        debugger;
        // console.log({ text, authToken });
        // encrypt the uploaded file and store it locally
        const pass = prompt("Enter passphrase to encrypt your identity file.");
        const decIdentity = JSON.parse(text);
        const expk = ExtendedPrivateKey.from_string(decIdentity.xprv);
        const publicKey = expk.get_public_key();
        await setEncryptionKeyFromPassphrase(pass, publicKey);
        const encryptedData = encryptData(Buffer.from(text), encryptionKey);
        console.log({ encryptedData });
        setIdentity(Buffer.from(encryptedData).toString("base64"));

        setLoadIdentityStatus(FetchStatus.Success);
      } catch (e) {
        console.error(e);
        setLoadIdentityStatus(FetchStatus.Error);
      }
    },
    [
      loadIdentityStatus,
      isValidIdentity,
      setIdentity,
      encryptionKey,
      setEncryptionKeyFromPassphrase,
    ]
  );

  const getIdentity = useCallback(async () => {
    if (bapProfile) {
      return bapProfile;
    }
    setBapProfileStatus(FetchStatus.Loading);
    console.log("get identity");

    const payload = {
      idKey: ``,
    };

    const res = await fetch(`https://bap-api.com/v1/getIdentity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const resp = { idKey: "something" };
    setBapProfileStatus(FetchStatus.Success);
    setBapProfile(resp);
    return resp;
  }, [setBapProfile, bapProfileStatus, bapProfile]);

  const value = useMemo(
    () => ({
      identity,
      setIdentity,
      decIdentity,
      setDecIdentity,
      getIdentity,
      bapProfileStatus,
      bapProfile,
      onFileChange,
      loadIdentityStatus,
    }),
    [
      identity, // encrypted identity file
      getIdentity,
      decIdentity,
      setDecIdentity,
      bapProfileStatus,
      setIdentity,
      onFileChange,
      bapProfile,
      loadIdentityStatus,
    ]
  );

  return (
    <>
      <BapContext.Provider value={value} {...props} />
    </>
  );
};

const useBap = () => {
  const context = useContext(BapContext);
  if (context === undefined) {
    throw new Error("useBap must be used within an BapProvider");
  }
  return context;
};

export { BapProvider, useBap };

//
// Utils
//

const idStorageKey = "nitro__BapProvider_id";
const profileStorageKey = "nitro__BapProvider_profile";

const toText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
