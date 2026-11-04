type Props = {
  text: string | null;
};

export default function InviteStatus({ text }: Props) {
  if (!text) return null;
  return (
    <p className="invite-status" role="status">
      {text}
    </p>
  );
}
