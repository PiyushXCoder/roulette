// @generated automatically by Diesel CLI.

diesel::table! {
    player (email) {
        email -> Text,
        fullname -> Text,
        created_at -> Timestamp,
        modified_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    session (id) {
        id -> Uuid,
        player_id -> Nullable<Text>,
        session_type_id -> Nullable<Uuid>,
        token -> Nullable<Text>,
        created_at -> Timestamp,
        modified_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    session_type (id) {
        id -> Uuid,
        name -> Nullable<Text>,
        created_at -> Timestamp,
        modified_at -> Timestamp,
        deleted_at -> Nullable<Timestamp>,
    }
}

diesel::joinable!(session -> player (player_id));
diesel::joinable!(session -> session_type (session_type_id));

diesel::allow_tables_to_appear_in_same_query!(
    player,
    session,
    session_type,
);
