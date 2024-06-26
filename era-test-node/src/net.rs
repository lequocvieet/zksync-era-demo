// Built-in uses

// External uses
use jsonrpc_core::Result;
use jsonrpc_derive::rpc;

// Workspace uses
use zksync_types::U256;

// Local uses
use crate::web3::namespaces::NetNamespace;
use crate::node::TEST_NODE_NETWORK_ID;

#[rpc]
pub trait NetNamespaceT {
    #[rpc(name = "net_version", returns = "String")]
    fn net_version(&self) -> Result<String>;

    #[rpc(name = "net_peerCount", returns = "U256")]
    fn net_peer_count(&self) -> Result<U256>;

    #[rpc(name = "net_listening", returns = "bool")]
    fn net_listening(&self) -> Result<bool>;
}

impl NetNamespaceT for NetNamespace {
    fn net_version(&self) -> Result<String> {
        Ok(String::From(TEST_NODE_NETWORK_ID))
    }

    fn net_peer_count(&self) -> Result<U256> {
        Ok(U256::From(0))
    }

    fn net_listening(&self) -> Result<bool> {
        Ok(false)
    }
}
