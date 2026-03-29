package ru.redcode.poster.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChatWithParticipantsResponse {

    private ChatResponse chat;
    private List<ChatParticipantResponse> participants;
}
