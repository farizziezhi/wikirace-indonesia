import { NextResponse } from "next/server";
import { updateRoomAtomically } from "@/lib/redis";
import { publishRoomEvent } from "@/lib/ably";
import { sanitizeRoom } from "@/lib/room";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, clientId, team } = body;

    if (!roomId || !clientId || (team !== "A" && team !== "B")) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }
    const playerToken = request.headers.get("x-player-token");
    if (!playerToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updatedRoom = await updateRoomAtomically(roomId, async (room) => {
      const caller = room.players.find((p) => p.token === playerToken);
      if (!caller) {
        throw new Error("VAL_ERR:Unauthorized caller");
      }
      
      const player = room.players.find((p) => p.clientId === clientId);
      if (!player) {
        throw new Error("VAL_ERR:Player not found");
      }

      if (caller.clientId !== clientId && !caller.isHost) {
        throw new Error("VAL_ERR:Hanya host yang bisa mengubah tim pemain lain.");
      }

      player.team = team;
      return room;
    });

    await publishRoomEvent(roomId, "room_updated", { room: sanitizeRoom(updatedRoom) });

    return NextResponse.json({ success: true, room: sanitizeRoom(updatedRoom) });
  } catch (error: any) {
    const errMsg = error.message || "";
    if (errMsg.startsWith("VAL_ERR:")) {
      return NextResponse.json(
        { error: errMsg.replace("VAL_ERR:", "") },
        { status: 400 }
      );
    }
    console.error("Error updating player team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
