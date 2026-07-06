import { NextResponse } from "next/server";
import { updateRoomAtomically } from "@/lib/redis";
import { publishRoomEvent } from "@/lib/ably";

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

    const updatedRoom = await updateRoomAtomically(roomId, async (room) => {
      const player = room.players.find((p) => p.clientId === clientId);
      if (!player) {
        throw new Error("VAL_ERR:Player not found");
      }
      player.team = team;
      return room;
    });

    await publishRoomEvent(roomId, "room_updated", { room: updatedRoom });

    return NextResponse.json({ success: true, room: updatedRoom });
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
