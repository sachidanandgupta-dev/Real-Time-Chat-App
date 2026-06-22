export function getConversationLabel(conversation, currentUserId) {
  if (conversation.isGroup) return conversation.groupName;
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  return other?.username || "Unknown user";
}

export function getConversationAvatarProps(conversation, currentUserId, onlineUserIds) {
  if (conversation.isGroup) {
    return { name: conversation.groupName, color: "#5B8DEF", isGroup: true };
  }
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  return {
    name: other?.username,
    color: other?.avatarColor,
    online: onlineUserIds.includes(other?._id),
  };
}
