import React from "react";
import { toast } from "react-toastify";

const toastOptions = {
    position: "top-right" as const,
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme: "colored" as const,
    icon: false as const,
};

const Msg = ({ icon, text }: { icon: string; text: string }) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
        <i className={`fas ${icon}`} />
        <span>{text}</span>
    </span>
);

export const notifySuccess = (msg: string) =>
    toast.success(<Msg icon="fa-check-circle" text={msg} />, toastOptions);

export const notifyError = (msg: any) => {
    const text = typeof msg === 'string'
        ? msg
        : (msg?.friendlyMessage || msg?.message || msg?.error || "Une erreur inattendue s'est produite.");
    toast.error(<Msg icon="fa-exclamation-circle" text={text} />, toastOptions);
};

export const notifyWarning = (msg: string) =>
    toast.warning(<Msg icon="fa-exclamation-triangle" text={msg} />, toastOptions);

export const notifyInfo = (msg: string) =>
    toast.info(<Msg icon="fa-info-circle" text={msg} />, toastOptions);