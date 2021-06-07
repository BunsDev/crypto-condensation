import React, { useState } from "react";
import { useSelector } from "react-redux";
import BN from "bn.js";
import styled from "styled-components";

import {
  addAssets,
  getTokenContract,
  tokenApproved,
} from "../services/contracthelper";
import { selectTokens } from "../state/tokenSlice";
import { Asset } from "../types/CapsuleType";
import Token from "../types/Token";
import Assets from "./Assets";
import Popup from "./Popup";
import { getGlobals } from "../utils/globals";

const StyledAddAssets = styled.div`
  width: 100%;
`;

type Approval = {
  asset: Asset;
  approved: boolean;
};

type Props = {
  capsuleId: number;
  show: boolean;
  close: () => void;
  updateCapsules: () => void;
};

const AddAssets = (props: Props): JSX.Element => {
  const tokens = useSelector(selectTokens);

  const ethAsset: Asset = { token: "ETH", value: "0" };
  const approval: Approval = { asset: ethAsset, approved: true };

  const [assets, setAssets] = useState<Asset[]>([ethAsset]);
  const [loading, setLoading] = useState(false);
  const [approvals, setApprovals] = useState<Approval[]>([approval]);

  const unapproved = approvals.filter((a: Approval) => !a.approved);

  const addressSymbol = (address: string) =>
    tokens.filter((token: Token) => token.address === address)[0].symbol;

  const tokenApprove = async (address: string) => {
    const globals = await getGlobals();
    const tokenContract = await getTokenContract(address);
    tokenContract.methods
      .approve(globals.CAPSULE, new BN("9999999999999999999999999999"))
      .send()
      .on("transactionHash", (hash: any) => {
        setLoading(true);
      })
      .on("receipt", async (receipt: any) => {
        await updateApprovals(assets);
        setLoading(false);
      })
      .on("error", (err: any) => {
        console.log(`Error: ${err}`);
        setLoading(false);
      });
  };

  const updateApprovals = async (assets: Asset[]) => {
    const _approvals: Approval[] = [];
    const promises = assets.map(async (asset: Asset) => {
      _approvals.push({
        asset,
        approved: await tokenApproved(asset.token),
      });
    });
    await Promise.all(promises);
    setApprovals(_approvals);
  };

  const click = async () => {
    setLoading(true);
    await addAssets(props.capsuleId, assets);
    setLoading(false);
    props.updateCapsules();
    props.close();
  };

  return (
    <Popup
      show={props.show}
      close={props.close}
      header="Add Assets"
      buttonText={
        unapproved.length === 0
          ? "Add Assets"
          : `Approve ${addressSymbol(unapproved[0].asset.token)}`
      }
      buttonAction={() => {
        if (unapproved.length === 0) click();
        else tokenApprove(unapproved[0].asset.token);
      }}
      loading={loading}
      content={
        <StyledAddAssets>
          <Assets
            assets={assets}
            setAssets={(assets: Asset[]) => {
              setAssets(assets);
              updateApprovals(assets);
            }}
          />
        </StyledAddAssets>
      }
    />
  );
};

export default AddAssets;
