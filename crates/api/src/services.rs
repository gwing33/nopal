pub const FILE_DESCRIPTOR_SET: &[u8] = tonic::include_file_descriptor_set!("nopal_descriptor");

pub mod proto {
    pub mod account {
        tonic::include_proto!("account");
    }
}
