"use client";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import useRecruiterAuthStore from "@/store/recruiter/recruiterauthStore";
import useChatStore from "@/store/recruiter/ChatStore";
import { Skeleton } from "@/components/ui/skeleton";
import API from "@/utils/interceptor";
import { toast } from "sonner";
import useAuthStore from "@/store/authStore";
import useChatSocket from "@/lib/common/ChatSocket";

// ✅ Chat List Item
const ChatListItem = ({
  chat,
  isSelected,
  onClick,
  unreadMessCount: getUnreadCount,
}) => {
  const avatarSrc =
    chat?.user?.image?.data || chat?.avatar?.data || chat?.image?.data;
  const isBase64 =
    avatarSrc && typeof avatarSrc === "string" && avatarSrc.startsWith("data:");

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 m-2 border-[1.6px] border-zinc-200 rounded-lg cursor-pointer transition-all duration-150 ${
        isSelected ? "bg-gray-200" : "bg-white hover:bg-gray-100"
      }`}
    >
      <div className="w-12 h-12 border-[1.6px] border-zinc-300 rounded-full overflow-hidden flex-shrink-0 relative">
        {avatarSrc ? (
          isBase64 ? (
            <img
              src={avatarSrc}
              alt={chat.name || ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={avatarSrc}
              width={40}
              height={40}
              alt={chat.name || ""}
              className="object-cover"
            />
          )
        ) : (
          <div className="w-full h-full rounded-full bg-gray-300 flex items-center justify-center font-semibold text-gray-700 text-sm">
            {chat.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-medium text-gray-800 truncate">{chat?.name}</h2>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 truncate flex-1">
            {chat?.lastMessage?.content || "No messages yet"}
          </p>

          {getUnreadCount > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
              {getUnreadCount > 9 ? "9+" : getUnreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ✅ Search Result Item
const SearchResultItem = ({ applicant, onClick }) => {
  const user = applicant.user || {};
  const role = applicant.job?.role || applicant.internship?.role || "Applied";
  const avatarSrc = user.image?.data;
  const isBase64 =
    avatarSrc && typeof avatarSrc === "string" && avatarSrc.startsWith("data:");

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 relative">
        {avatarSrc ? (
          isBase64 ? (
            <img
              src={avatarSrc}
              alt={user.name || ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={avatarSrc}
              width={40}
              height={40}
              alt={user.name || ""}
              className="object-cover"
            />
          )
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-semibold text-gray-700 text-sm">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="font-medium text-gray-800 truncate">{user.name}</h2>
        <p className="text-xs text-gray-500 truncate">{role}</p>
      </div>
    </div>
  );
};

const ChatSidebar = () => {
  const [search, setSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const router = useRouter();

  const { recruiter } = useRecruiterAuthStore();
  const { user } = useAuthStore();

  const currentUser = recruiter || user;
  const currentRole = recruiter ? "Recruiter" : "User";
  const currentUserId = currentUser?.id || currentUser?.id;

  const {
    chats = [],
    selectedChat,
    setSelectedChat,
    fetchChatList,
    loading,
    getUnreadCount,
  } = useChatStore();

  // ✅ Socket hook for real-time seen updates
  const { openChat } = useChatSocket({
    userId: currentUserId,
    role_type: currentRole,
  });

  // 🟢 Load chat list
  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  // 🟣 Handle search
  useEffect(() => {
    if (search.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await API.get(
          `/common/conversation/searchApplicants?query=${encodeURIComponent(
            search
          )}`
        );
        if (data.success) setSearchResults(data.applicants || []);
      } catch (err) {
        toast.error(err.message);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 600);

    return () => clearTimeout(delay);
  }, [search]);

  // 🔹 Handle selecting search result
  const handleSearchResultClick = (applicant) => {
    const tempId = `temp_${applicant.user._id}`;

    const chat = {
      _id: tempId, // ✅ use consistent key name
      name: applicant.user.name,
      avatar: applicant.user.image?.data,
      user: applicant.user,
      online: applicant.user.onlineStatus || false,
      lastseen: applicant.user.lastActiveDisplay || "Unknown",
    };

    // ✅ Access old chats using get()
    const prevChats = useChatStore.getState().chats || [];
    const updatedChats = [...prevChats.filter((c) => c._id !== tempId), chat];

    useChatStore.getState().setChats(updatedChats);
    useChatStore.getState().setSelectedChat(chat);

    setSearch("");
    setSearchResults([]);
  };

  // 🔹 Avatar setup
  const avatarSrc = currentUser?.image?.data;
  const isBase64 =
    avatarSrc && typeof avatarSrc === "string" && avatarSrc.startsWith("data:");

  const unreadCount = getUnreadCount();

  return (
    <div className="flex flex-col h-full w-full bg-white border-r">
      <div className="pt-4 px-3 w-full border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          {/* 🧑 Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-12 h-12 flex justify-center items-center rounded-full border border-zinc-300 cursor-pointer hover:bg-gray-50 transition-all relative overflow-hidden">
                {avatarSrc ? (
                  isBase64 ? (
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Image
                      src={avatarSrc}
                      width={48}
                      height={48}
                      alt="Profile"
                      className="rounded-full object-cover"
                    />
                  )
                ) : (
                  <h1 className="text-lg font-semibold text-gray-700">
                    {currentUser?.name?.[0]?.toUpperCase() ||
                      (recruiter ? "R" : "U")}
                  </h1>
                )}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    recruiter
                      ? "/recruiterDashboard/profile"
                      : "/job-seekerDashboard/profile"
                  )
                }
              >
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              {recruiter ? (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push("/recruiterDashboard")}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/my-postings")}>
                    My Postings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    Settings
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push("/job-seekerDashboard")}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/applied-jobs")}
                  >
                    My Applications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    Settings
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => router.back()}
            variant="outline"
            className="text-sm font-medium border-[1.5px]"
          >
            Return to Dashboard
          </Button>
        </div>

        {recruiter && (
          <>
            <Input
              placeholder="Search applicants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full my-4 bg-gray-100 border-gray-200 focus-visible:ring-1 focus-visible:ring-gray-400"
            />

            {/* <Button
              onClick={() => setGroupModal(true)}
              className="bg-gray-200 my-3 hover:bg-gray-300 text-black border-[1.6px] border-zinc-300"
            >
              Create Group
            </Button> */}
          </>
        )}
      </div>

      {/* 🔹 SEARCH RESULTS */}
      {search.trim() && (
        <div className="border-b bg-gray-50">
          <div className="p-2 border-b">
            <h3 className="text-sm font-medium text-gray-700">
              Search Results
            </h3>
          </div>
          <div className="relative w-full">
            {/* 🔍 Scrollable Search Results Dropdown */}
            <ScrollArea
              className="
      absolute top-full left-0 w-full 
      h-80 p-1 mt-2 
      bg-white shadow-lg border border-gray-200 rounded-xl 
      z-[1000] overflow-auto
    "
            >
              {searchLoading ? (
                <div className="space-y-3 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="w-10 h-10 rounded-full bg-gray-300" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[80%] bg-gray-300" />
                        <Skeleton className="h-3 w-[60%] bg-gray-300" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((applicant, index) => (
                  <React.Fragment key={applicant._id}>
                    <SearchResultItem
                      applicant={applicant}
                      onClick={() => handleSearchResultClick(applicant)}
                    />
                    {index < searchResults.length - 1 && (
                      <hr className="border-t border-gray-200 mx-4" />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4 text-sm">
                  No results found
                </p>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* 🔹 CHAT LIST */}
      <ScrollArea className="flex-1 modern-scroll overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-gray-300" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-[70%] bg-gray-300" />
                  <Skeleton className="h-3 w-[50%] bg-gray-300" />
                </div>
              </div>
            ))}
          </div>
        ) : chats.length > 0 ? (
          chats.map((chat) => (
            <ChatListItem
              key={chat._id}
              chat={chat}
              unreadMessCount={unreadCount}
              isSelected={selectedChat?._id === chat._id}
              onClick={async () => {
                setSelectedChat(chat);
                useChatStore.getState().setMessageLoading(true);

                try {
                  const { data } = await API.get(
                    `/common/conversation/messages/${chat._id}`
                  );
                  if (data.success) {
                    useChatStore
                      .getState()
                      .setMessages(chat._id, data.messages);

                    const currentUserId =
                      useAuthStore.getState().user?.id ||
                      useRecruiterAuthStore.getState().recruiter?.id;

                    // ✅ Call already-defined function
                    openChat({ chatId: chat._id, viewerId: currentUserId });
                  }
                } catch (err) {
                } finally {
                  useChatStore.getState().setMessageLoading(false);
                }
              }}
            />
          ))
        ) : (
          <div className="p-6 text-center text-gray-500 text-sm">
            No chats yet
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;
